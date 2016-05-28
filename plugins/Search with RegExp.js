
//sValidation=nyfjs
//sCaption=Search with RegExp ...
//sHint=Search database or current branch with regular expression or for a phrase
//sCategory=MainMenu.Search
//sLocaleID=p.SearchRegExp
//sAppVerMin=6.0
//sShortcutKey=Shift+F3

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

try{

	var xNyf=new CNyfDb(-1);
	if(xNyf.isOpen()){

		var sCfgKey='SearchRegExp.Phrase';
		var sMsg=_lc2('Phrase', 'Enter words or RegExp (eg. /pattern/i ) to find');
		var sFor=prompt(sMsg, localStorage.getItem(sCfgKey)||''); sFor=_trim(sFor);
		if(sFor){

			localStorage.setItem(sCfgKey, sFor);

			var sQR=plugin.getQueryResults(false)||'';

			var vActs=[
				  _lc2('InBranch', '1. Scan info items in the current branch')
				, _lc2('InTitles', '2. Scan item titles in the outline')
				, _lc2('InDatabase', '3. Scan the whole database')
				];

			if(sQR){
				vActs[vActs.length]=_lc2('InResults', '4. Scan items listed in the last query results');
			}

			sCfgKey='SearchRegExp.iAction';
			var sMsg=_lc('p.Common.SelAction', 'Please select an action form within the dropdown list');
			var iSel=dropdown(sMsg, vActs, localStorage.getItem(sCfgKey));
			if(iSel>=0){

				localStorage.setItem(sCfgKey, iSel);

				plugin.initProgressRange(plugin.getScriptTitle(), 0);

				var mToScan={};
				var sDefNoteFn=plugin.getDefNoteFn();

				var nCountOfEntries=0;
				var _push=function(i, p, n){
					var v=mToScan[i];
					if(!v) v=mToScan[i]=[];
					v[v.length]={sSsgPath: p, sSsgName: n};
					nCountOfEntries++;
				};

				var bOnlyTitles=(iSel==1);
				switch(iSel){
					case 0:
					case 1:
					case 2:
					{
						var bBranch=(iSel==0), sCurItem=bBranch ? plugin.getCurInfoItem() : plugin.getDefRootContainer();
						if(!sCurItem){
							sCurItem=plugin.getDefRootContainer();
							bBranch=false;
						}

						var iDbPos=plugin.getCurDbIndex();
						xNyf.traverseOutline(sCurItem, bBranch, function(sSsgPath, iLevel){

							var sTitle=xNyf.getFolderHint(sSsgPath); if(!sTitle) sTitle='Untitled';

							var bContinue=plugin.ctrlProgressBar(sTitle, 1, true);
							if(!bContinue) return true;

							if(bOnlyTitles){
								_push(iDbPos, sSsgPath, '');
							}else{
								var vFiles=xNyf.listFiles(sSsgPath), bDefNote=false;
								for(var i in vFiles){
									var sSsgName=vFiles[i];
									if(sSsgName==sDefNoteFn) bDefNote=true;
									_push(iDbPos, sSsgPath, sSsgName);
								}
								//if no default rtf note, put the ssg folder onto the list;
								if(!bDefNote) _push(iDbPos, sSsgPath, '');
							}
						});
						break;
					}
					case 3:
					{
						var vQR=sQR.split('\n');
						for(var i in vQR){
							var v=(vQR[i]||'').split('\t')||[], c=v.length;
							var sDbid=(c>0) ? v[0] : '';
							var sSsgPath=(c>1) ? v[1] : '';
							var sSsgName=(c>2) ? v[2] : '';
							var iDbPos=plugin.getDbIndex(sDbid);
							if(sDbid && sSsgPath && iDbPos>=0){
								_push(iDbPos, sSsgPath, sSsgName);
							}
						}
						break;
					}
				}

				var _srcfn_of_shortcut=function(xDb, sSsgFn){
					var sSrcFn='';
					var xTmpFn=new CLocalFile(platform.getTempFile()); platform.deferDeleteFile(xTmpFn);
					if(xDb.exportFile(sSsgFn, xTmpFn)>0){
						var vLines=(xTmpFn.loadText()||'').split('\n');
						for(var i in vLines){
							var sLine=_trim(vLines[i]), sKey='url=file://';
							if(sLine.toLowerCase().indexOf(sKey)==0){
								var sSrc=sLine.substr(sKey.length);
								if(sSrc){
									sSrcFn=sSrc;
									break;
								}
							}
						}
					}
					xTmpFn.delete();
					return sSrcFn;
				};

				var xRE;
				{
					//construct the xRE;
					var v=sFor.match(/^\/(.*)\/([igm]*)$/);
					if(v && v.length>1){
						var sRE=v[1], sOpt=v[2];
						if(sRE){
							xRE=new RegExp(sRE, sOpt.replace(/g/gi, '')); //remove the redundant 'g'.
						}
					}
				}

				var _match_boolean=function(s){
					var bOK=false;
					//To-do ... ??????????
					return bOK;
				};

				var _match=function(s){
					var bOK=false, s=s.replace(/[\r\n]/g, ' ');
					if(xRE){
						bOK=s.match(xRE);
					}
					if(!bOK){
						bOK=_match_boolean(s);
					}
					if(!bOK){
						bOK=s.toLowerCase().indexOf(sFor.toLowerCase())>=0;
					}
					return bOK;
				};

				var _findstr_to_hilite=function(s){
					if(xRE){
						//2012.2.7 consider the regexp control words, like: /\bmain\b/i, that is to highlight 'main', rather than 'b' or 'i';
						s=s.replace(/\\\w/g, '');
						s=s.replace(/\/[igm]+$/g, '');
					}
					s=s.replace(/[`~\!@#\$%\^&\*\(\)_\+\-=\[\]\\\{\}\|;\'\:\"\,\.\/<>\?]/g, ' ') .replace(/\s{2,}/g, ' ');
					return s;
				};

				//2011.9.4 this is used for highlighting the search words;
				var sFindStr=_findstr_to_hilite(sFor);

				plugin.runQuery({bListOut: true}); //make sure the Query-results window is open and cleared;

				plugin.initProgressRange(plugin.getScriptTitle(), nCountOfEntries);

				for(var iDbPos in mToScan){

					var vII=mToScan[iDbPos];
					if(vII.length>0){

						var xDb=new CNyfDb(parseInt(iDbPos)), sDbid=xDb.getDbFile();
						for(var i in vII){

							var xII=vII[i];
							var sSsgPath=xII.sSsgPath, sSsgName=xII.sSsgName, sTitle=xDb.getFolderHint(sSsgPath)||'';
							var bDefNote=(sSsgName==sDefNoteFn);

							var bContinue=plugin.ctrlProgressBar((bDefNote?'':sSsgName)||sTitle||'Untitled', 1, true);
							if(!bContinue) break;

							var sTxt='';
							if(sSsgName){

								var sFn2Parse='', sExt='', xTmpFn;
								{
									var xSsgFn=new CLocalFile(sSsgPath); xSsgFn.append(sSsgName);
									sExt=xSsgFn.getExtension();
									var sComment=xNyf.getFileHint(xSsgFn);
									if(xNyf.isShortcut(xSsgFn)){
										var sSrc=_srcfn_of_shortcut(xDb, xSsgFn);
										var xSrc=new CLocalFile(sSrc);
										if(xSrc.exists()){
											sFn2Parse=xSrc;
											sExt=xSrc.getExtension();
										}
									}else{
										if(sExt){
											xTmpFn=new CLocalFile(platform.getTempFile('', '', sExt)); platform.deferDeleteFile(xTmpFn);
											if(xDb.exportFile(xSsgFn, xTmpFn)>0){
												sFn2Parse=xTmpFn;
											}
										}
									}

								}

								if(sFn2Parse && sExt){
									sTxt=platform.parseFile(sFn2Parse, sExt)||'';
								}

								if(xTmpFn) xTmpFn.delete(); //remove tmp files as soon as possible;

								//2013.10.21 take a look at filenames as well for attachments.
								//if(bDefNote && sTitle) sTxt=sTitle+'\n'+sTxt;
								if(bDefNote){
									if(sTitle) sTxt=sTitle+'\n'+sTxt;
								}else{
									sTxt=sSsgName+'\n'+sTxt;
								}

								if(sComment) sTxt+='\n'+sComment;
							}else{
								//To scan item titles only;
								sTxt=sTitle;
							}

							if(sTxt && _match(sTxt)){
								var sLine=sDbid+'\t'+sSsgPath+'\t'+sSsgName;
								plugin.appendToResults(sLine, {sDelimiter: '\t', sFindStr: sFindStr});
							}
						}
					}
				}
			}
		}

	}else{
		alert(_lc('Prompt.Warn.NoDbOpened', 'No database is currently opened.'));
	}

}catch(e){
	alert(e);
}
