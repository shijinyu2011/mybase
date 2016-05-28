
//sValidation=nyfjs
//sCaption=Import directory tree ...
//sHint=Import directory tree with files saved as attachments/hyperlinks
//sCategory=MainMenu.Capture
//sLocaleID=p.ImportDirTree
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

try{

	var xNyf=new CNyfDb(-1);

	if(xNyf.isOpen()){

		if(!xNyf.isReadonly()){

			var sCfgKey='ImportDirTree.sSrcDir';
			var sDirToImport=platform.browseForFolder(_lc2('SelSrc', 'Please select a source directory tree to import.'), localStorage.getItem(sCfgKey));

			if(sDirToImport){

				localStorage.setItem(sCfgKey, sDirToImport);

				var vActs=[
					  _lc2('Attach', '1. Import directory tree with files saved as attachments')
					, _lc2('Hyperlink', '2. Import directory tree with files saved as hyperlinks')
					];

				sCfgKey='ImportDirTree.iAction';
				var sMsg=_lc('p.Common.SelAction', 'Please select an action form within the dropdown list');
				var iSel=dropdown(sMsg, vActs, localStorage.getItem(sCfgKey));
				if(iSel>=0){

					localStorage.setItem(sCfgKey, iSel);

					/*
					var _make_regexp=function(sPat){

						sPat=_trim(sPat)||'*';

						var xRE;
						var v=sPat.match(/^\/(.*)\/([igm]*)$/);
						if(v && v.length>1){
							var sRE=v[1], sOpt=v[2];
							if(sRE){
								xRE=new RegExp(sRE, sOpt.replace(/g/gi, '')); //remove the redundant 'g'.
							}
						}else{
							sPat=sPat.replace(/[\!\+\-\.\\\/\[\]\(\)\{\}\$\^\|]/g, function(w){return '\\'+w;});
							sPat=sPat.replace("[\?]", function(w){return '.{1}'});
							sPat=sPat.replace("[\*]", function(w){return '.*'});
							xRE=new RegExp(sPat);
						}

						return sPat;
					};

					sCfgKey='ImportDirTree.PatternDir';
					sMsg=_lc2('PatternDir', 'Enter a wildcard to match folder names');
					var sPatternDir=prompt(sMsg, localStorage.getItem(sCfgKey)||''); sPatternDir=_trim(sPatternDir);
					var xDirRE=_make_regexp(sPatternDir);
					if(xDirRE){

						localStorage.setItem(sCfgKey, sPatternDir);

						sCfgKey='ImportDirTree.PatternFile';
						sMsg=_lc2('PatternFile', 'Wildcard to match file names');
						var sPatternFile=prompt(sMsg, localStorage.getItem(sCfgKey)||''); sPatternFile=_trim(sPatternFile);
						var xFileRE=_make_regexp(sPatternFile);
						if(xFileRE){

							localStorage.setItem(sCfgKey, sPatternFile);
						}

					}
					*/

					plugin.initProgressRange(plugin.getScriptTitle());

					var nFolders=0, nFiles=0;
					var sCurItem=plugin.getCurInfoItem(-1)||plugin.getDefRootContainer();

					var _find_unique_id=function(sSsgPath){
						return xNyf.getChildEntry(sSsgPath, 0);
					};

					var _fix_bad_controlwords=function(s)
					{
						//2011.8.19 alter the obsolete word '\chcbpat#' to '\highlight#';
						return (s||'').replace(/(\\chcbpat)(\d+)/g, '\\highlight$2');
					}

					var _encode_filename=function(sFn){
						var p=(''+sFn).indexOf(':'), sDrv='', sPath=''+sFn;
						if(p>=0){
							sDrv=sFn.substring(0, p+1);
							sPath=sFn.substring(p+1);
						}
						var sUrl=sDrv, v=sPath.split('\\');
						for(var i in v){
							var sTmp=v[i];
							if(sTmp){
								//2012.9.25 bug-fix: the first back-slash makes 'sTmp' empty, 
								//consequently results in duplicate slashes in 'sUrl';
								if(sUrl) sUrl+='/';
								sUrl+=encodeURIComponent(sTmp);
							}
						}
						return sUrl;
					};

					var vFails=[], bContinue=true;
					var sDefNoteFn=plugin.getDefNoteFn();
					var sRenameDefNote='defnote.rtf';

					var _defnote_ifany=function(v){
						var sDef, sRtf;
						for(var i in v){
							var sName=v[i]||'';
							var xFn=new CLocalFile(sName);
							if(xFn.getExtension(true).toLowerCase()=='.rtf' && !sRtf){
								sRtf=sName;
							}
							if(sRenameDefNote==sName.toLowerCase()){
								sDef=sName;
								break;
							}
						}
						return sDef||sRtf;
					};

					var _import_files_as_attachments=function(xSsgPath, xWinPath){
						var v=xWinPath.listFiles();
						var sDefRtf=_defnote_ifany(v)||''; //2011.9.13 detect if any file can be the default rtf note;
						for(var i in v){
							var sName=v[i];
							var xWinFn=new CLocalFile(xWinPath); xWinFn.append(sName);
							var xSsgFn=new CLocalFile(xSsgPath); xSsgFn.append((sDefRtf==sName) ? sDefNoteFn : sName);

							bContinue=plugin.ctrlProgressBar(sName, 1, true);
							if(!bContinue) return false;

							var bRtf=xWinFn.getExtension(true).toLowerCase()=='.rtf';
							if(bRtf){
								//2011.9.13 fix bad control words in RTF text;
								var sRtf=xWinFn.loadText();
								var sNew=_fix_bad_controlwords(sRtf);
								if(sRtf!=sNew){
									var xTmpFn=new CLocalFile(platform.getTempFile('', '', '.tmp')); platform.deferDeleteFile(xTmpFn);
									xTmpFn.saveAnsi(sNew);
									xWinFn=xTmpFn;
								}
							}

							var nBytes=xNyf.createFile(xSsgFn, xWinFn);
							if(nBytes<0) vFails[vFails.length]=sName; else nFiles++;
						}
						return true;
					};

					var _import_files_as_hyperlinks=function(xSsgPath, xWinPath){
						var v=xWinPath.listFiles(), sTxt='';
						for(var i in v){
							var xWinFn=new CLocalFile(xWinPath); xWinFn.append(v[i]);

							bContinue=plugin.ctrlProgressBar(xWinFn, 1, true);
							if(!bContinue) return false;

							if(sTxt) sTxt+='\n\n\n';
							sTxt+=(v[i]+'\n'+'file:///'+_encode_filename(''+xWinFn)+'\nSize: '+xWinFn.getFileSize()+'   Updated: '+xWinFn.getModifyTime());
						}

						var xSsgFn=new CLocalFile(xSsgPath); xSsgFn.append(plugin.getDefNoteFn());
						var nBytes=xNyf.createTextFile(xSsgFn, sTxt);
						return true;
					};

					var _import_folder=function(sSsgPath, sWinPath, xActOnFile){

						bContinue=plugin.ctrlProgressBar(sWinPath, 1, true);
						if(!bContinue) return false;

						var xWinPath=new CLocalFile(sWinPath);
						var xSubItem=new CLocalFile(sSsgPath); xSubItem.append(_find_unique_id(sSsgPath));
						if(xNyf.createFolder(xSubItem)){
							xNyf.setFolderHint(xSubItem, xWinPath.getLeafName());

							bContinue=xActOnFile(xSubItem, xWinPath);
							if(!bContinue) return false;

							var v=xWinPath.listFolders();
							for(var i in v){
								var xSubDir=new CLocalFile(xWinPath); xSubDir.append(v[i]);
								if(!_import_folder(xSubItem, xSubDir, xActOnFile)){
									return false;
								}
							}
							nFolders++;
						}
						return true;
					};

					var xAct=(iSel==0) ? _import_files_as_attachments : _import_files_as_hyperlinks;
					_import_folder(sCurItem, sDirToImport, xAct);

					if(nFolders>0){
						plugin.refreshOutline(-1, sCurItem);
					}

					if(vFails.length>0){
						alert(_lc2('Fail.Import', 'Failed to import the following files.')+'\n\n'+vFails);
					}else{
						alert(_lc2('Done', 'Successfully imported the directory tree.')+'\n\n'+sDirToImport);
					}

				}
			}

		}else{
			alert(_lc('Prompt.Warn.ReadonlyDb', 'Cannot modify the database opened as Readonly.'));
		}

	}else{
		alert(_lc('Prompt.Warn.NoDbOpened', 'No database is currently opened.'));
	}
}catch(e){
	alert(e);
}
