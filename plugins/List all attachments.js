
//sValidation=nyfjs
//sCaption=List attachments/shortcuts ...
//sHint=List all attachments/shortcuts stored in the database
//sCategory=MainMenu.Search
//sLocaleID=p.ListAttachments
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

try{

	var xNyf=new CNyfDb(-1);
	if(xNyf.isOpen()){

		var sCurItem=plugin.getCurInfoItem();
		var sPathRoot=plugin.getDefRootContainer();
		var sDefNoteFn=plugin.getDefNoteFn();

		var vActs=[
			  _lc2('BranchAttach',		'In Branch, List Attachments only')
			, _lc2('BranchShortcut',	'In Branch, List Shortcuts only')
			, _lc2('BranchAll',			'In Branch, List Attachments and Shortcuts')
			, _lc2('DbAttach',			'In Database, List Attachments only')
			, _lc2('DbShortcut',		'In Database, List Shortcuts only')
			, _lc2('DbAll',				'In Database, List Attachments and Shortcuts')
			];

		var sCfgKey='ListAttachments.iAction';
		var sMsg=_lc('p.Common.SelAction', 'Please select an action form within the dropdown list');
		var iSel=dropdown(sMsg, vActs, localStorage.getItem(sCfgKey));
		if(iSel>=0){

			localStorage.setItem(sCfgKey, iSel);

			var bInclAttach=(iSel==0 || iSel==2 || iSel==3 || iSel==5);
			var bInclShortcut=(iSel==1 || iSel==2 || iSel==4 || iSel==5);
			var bCurBranch=(iSel==0|| iSel==1 || iSel==2);
			var bCurDb=(iSel==3|| iSel==4 || iSel==5);

			var sPathToScan=sCurItem, bStartFromItem=true;
			if(bCurDb){
				sPathToScan=sPathRoot;
				bStartFromItem=false;
			}

			var nFolders=0;

			//To estimate the progress range;
			xNyf.traverseOutline(sPathToScan, true, function(){
				nFolders++;
			});

			plugin.initProgressRange(plugin.getScriptTitle(), nFolders);

			plugin.runQuery({bListOut: true}); //make sure the Query-results window is open and cleared;

			var _act_on_treeitem=function(sSsgPath, iLevel){

				if(xNyf.folderExists(sSsgPath, false)){

					var sTitle=xNyf.getFolderHint(sSsgPath); if(!sTitle) sTitle='Untitled';
					var bContinue=plugin.ctrlProgressBar(sTitle, 1, true);
					if(!bContinue) return true;

					var vFiles=xNyf.listFiles(sSsgPath);
					for(var i in vFiles){
						var sName=vFiles[i];
						if(sName!=sDefNoteFn){
							var xSsgFn=new CLocalFile(sSsgPath); xSsgFn.append(sName);
							var sLine=xNyf.getDbFile()+'\t'+sSsgPath+'\t'+sName;
							if(xNyf.isShortcut(xSsgFn)){
								if(bInclShortcut){
									plugin.appendToResults(sLine, {sDelimiter: '\t', sFindStr: ''});
								}
							}else{
								if(bInclAttach){
									plugin.appendToResults(sLine, {sDelimiter: '\t', sFindStr: ''});
								}
							}
						}
					}
				}
			};

			xNyf.traverseOutline(sPathToScan, bStartFromItem, _act_on_treeitem);

		}

	}else{
		alert(_lc('Prompt.Warn.NoDbOpened', 'No database is currently opened.'));
	}

}catch(e){
	alert(e);
}
