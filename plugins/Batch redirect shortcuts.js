
//sValidation=nyfjs
//sCaption=Batch redirect shortcuts ...
//sHint=Redirect shortcuts in current branch by replacing file path to a new file path
//sCategory=MainMenu.Organize
//sLocaleID=p.RedirShortcuts
//sAppVerMin=6.0.6
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

try{
	var xNyf=new CNyfDb(-1);

	if(xNyf.isOpen()){

		if(!xNyf.isReadonly()){

			if(plugin.getCurNavigationTab()=='Outline'){

				var sCurItem=plugin.getCurInfoItem()||plugin.getDefRootContainer();
				if(sCurItem){

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

					var sCfgKey='RedirShortcuts.OldPath';
					var sMsg=_lc2('OldPath', 'Enter the old file path to replace. ( * to match all)');
					var sOld=prompt(sMsg, localStorage.getItem(sCfgKey)||''); sOld=_trim(sOld);
					if(sOld){
						localStorage.setItem(sCfgKey, sOld);

						sCfgKey='RedirShortcuts.NewPath';
						sMsg=_lc2('NewPath', 'Enter the new file path.');
						var sNew=prompt(sMsg, localStorage.getItem(sCfgKey)||''); sNew=_trim(sNew);
						if(sNew){
							localStorage.setItem(sCfgKey, sNew);

							var nFolders=0;

							//To estimate the progress range;
							xNyf.traverseOutline(sCurItem, true, function(){
								nFolders++;
							});

							plugin.initProgressRange(plugin.getScriptTitle(), nFolders);

							var bAll=(sOld=='*');
							if(!bAll){
								sOld=''+new CLocalFile(sOld, '\\'); //ensure a trailing slash;
							}

							var xNew=new CLocalFile(sNew, '\\'); //ensure a trailing slash;

							var nDone=0;

							var _add_shortcut=function(sSsgFn, sSrcFn){
								var sTxt='[InternetShortcut]\r\nURL=file://'+sSrcFn+'\r\n';
								return xNyf.createTextFile(sSsgFn, sTxt);
							};

							var _act_on_treeitem=function(sSsgPath, iLevel){

								if(xNyf.folderExists(sSsgPath, false)){

									var sTitle=xNyf.getFolderHint(sSsgPath); if(!sTitle) sTitle='== Untitled ==';
									var bContinue=plugin.ctrlProgressBar(sTitle, 1, true);
									if(!bContinue) return true;

									var vFiles=xNyf.listFiles(sSsgPath);
									for(var i in vFiles){
										var sName=vFiles[i];
										var xSsgFn=new CLocalFile(sSsgPath); xSsgFn.append(sName);
										if(xNyf.isShortcut(xSsgFn)){
											var sSrcFn=_srcfn_of_shortcut(xNyf, xSsgFn);
											var xSrcFn=new CLocalFile(sSrcFn);
											//2012.1.26 getDirectory() returns an object of CLocalFile, instead of string;
											var sPathSrc=''+xSrcFn.getDirectory(true), sName=xSrcFn.getLeafName();
											if( bAll || (sPathSrc.toLowerCase()==sOld.toLowerCase()) ){
												sSrcFn=''+xNew+sName;
												if(0<_add_shortcut(''+xSsgFn, sSrcFn)){
													if(xNyf.setShortcut(xSsgFn)){
														nDone++;
													}
												}
											}
										}
									}
								}
							};

							xNyf.traverseOutline(sCurItem, true, _act_on_treeitem);

							if(nDone>0){
								plugin.refreshDocViews(-1, sCurItem);
							}

							var sMsg=_lc2('Done', 'Total %nDone% shortcut(s) have been updated.');
							alert(sMsg.replace('%nDone%', nDone));
						}
					}

				}else{
					alert(_lc('Prompt.Warn.NoInfoItemSelected', 'No info item is currently selected.'));
				}

			}else{
				alert(_lc('Prompt.Warn.OutlineNotSelected', 'The outline tree view is currently not selected.'));
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
