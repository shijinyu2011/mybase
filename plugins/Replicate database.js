
//sValidation=nyfjs
//sCaption=Replicate database ...
//sHint=Replicate current database as a new one with a specified storage version
//sCategory=MainMenu.Maintain
//sLocaleID=p.ReplicateDatabase
//sAppVerMin=6.3
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

try{

	var xNyf=new CNyfDb(-1);
	if(xNyf.isOpen()){

		plugin.initProgressRange(plugin.getScriptTitle());

		var nSsgVer=xNyf.getSsgVer(), bUtf8=xNyf.isUtf8();
		var sArgs=plugin.newDbForm(plugin.getScriptTitle(), nSsgVer, bUtf8);
		if(sArgs){

			var sDbFn='', sPasswd='', nZlib=9;
			{
				var vLines=sArgs.split('\n');
				for(var j in vLines){
					var sLine=vLines[j];
					var p=sLine.indexOf('=');
					if(p>0){
						var sKey=sLine.substr(0, p);
						var sVal=sLine.substr(p+1);
						if(sKey=='sDbFn') sDbFn=sVal;
						else if(sKey=='sPasswd') sPasswd=sVal;
						else if(sKey=='nSsgVer') nSsgVer=parseInt(sVal);
						else if(sKey=='nZlib') nZlib=parseInt(sVal);
						else if(sKey=='bUtf8') bUtf8=parseInt(sVal);
					}
				}
			}

			var xFn=new CLocalFile(sDbFn);
			if(xFn.createFile()){
				var xDbDst=new CNyfDb(sDbFn, false, 0, nSsgVer, bUtf8);
				if(xDbDst.isOpen()){

					if(sPasswd) xDbDst.setDbPassword(sPasswd);
					if(nZlib>=0 && nZlib<=9) xDbDst.setCompressLevel(nZlib);

					var sDefNoteFn=plugin.getDefNoteFn();

					var _copy_entry_attr=function(sSsgPath){
						xDbDst.setFolderHint(sSsgPath, xNyf.getFolderHint(sSsgPath));
						xDbDst.setEntryAttr(sSsgPath, xNyf.getEntryAttr(sSsgPath));
						xDbDst.setEntryAppAttr(sSsgPath, xNyf.getEntryAppAttr(sSsgPath));

						var n=xNyf.getEntryAppDataCount(sSsgPath);
						for(var i=0; i<n; ++i){
							var x=xNyf.getAppDataOfEntryByPos(sSsgPath, i);
							xDbDst.setAppDataOfEntry(sSsgPath, i, x);
						}

						xDbDst.setCreateTime(sSsgPath, xNyf.getCreateTime(sSsgPath));
						xDbDst.setModifyTime(sSsgPath, xNyf.getModifyTime(sSsgPath));
					};

					var nInfoItems=0;
					var sUtf8Tag='__encoding.utf8';
					var xUtf8Tag=new CLocalFile(plugin.getDefRootContainer()); xUtf8Tag.append(sUtf8Tag)
					var _act_on_treeitem=function(sSsgPath, iLevel){

						if(xNyf.folderExists(sSsgPath, false)){

							var sTitle=xNyf.getFolderHint(sSsgPath); if(!sTitle) sTitle='New info item';

							var bContinue=plugin.ctrlProgressBar('#'+nInfoItems+sTitle, 1, true);
							if(!bContinue) return true;

							if(xDbDst.createFolder(sSsgPath)){
								_copy_entry_attr(sSsgPath);
								var vFiles=xNyf.listFiles(sSsgPath);
								for(var i in vFiles){
									var sName=vFiles[i];

									var sMsg=sName; if(sMsg==sDefNoteFn) sMsg=sTitle;

									var bContinue=plugin.ctrlProgressBar(sMsg, 1, true);
									if(!bContinue) return true;

									var xSsgFn=new CLocalFile(sSsgPath); xSsgFn.append(sName);

									//2013.10.15 the UTF8 tag is already inserted while the new db was created.
									if(sName==sUtf8Tag && xSsgFn.toString()==xUtf8Tag.toString()){
										continue;
									}
									var sTmpFn=platform.getTempFile(); platform.deferDeleteFile(sTmpFn);
									var xTmpFn=new CLocalFile(sTmpFn);
									if(xNyf.exportFile(xSsgFn, sTmpFn)>=0){
										if(xDbDst.createFile(xSsgFn, sTmpFn)>=0){
											//ok;
										}
									}
									xTmpFn.delete();
									_copy_entry_attr(xSsgFn);
								}
							}
							nInfoItems++;
							if(xDbDst.getSsgVer()==5){
								if(nInfoItems % 400 == 0){
									plugin.ctrlProgressBar('commiting ...', 1, false);
									xDbDst.save();
								}
							}
						}
					};

					xNyf.traverseOutline('/', false, _act_on_treeitem);

					plugin.ctrlProgressBar('Finishing ...', 1, false);
					if(xDbDst.save()){
						alert(_lc2('Done', 'Successfully replicated the database.')+'\n\n'+sDbFn);
					}

				}else{
					alert('Failed to create the new database.'+'\n\n'+sDbFn);
				}
			}else{
				alert('Failed to create the new file.'+'\n\n'+sDbFn);
			}
		}

	}else{
		alert(_lc('Prompt.Warn.NoDbOpened', 'No database is currently opened.'));
	}

}catch(e){
	alert(e);
}
