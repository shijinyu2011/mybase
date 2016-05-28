
//sValidation=nyfjs
//sCaption=Auto numbering ...
//sHint=Auto-number the child items of the current info item
//sCategory=MainMenu.Organize
//sLocaleID=p.AutoNumber
//sAppVerMin=6.0
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

				var _clear_number=function(s){
					return s.replace(/^\d+[.,)]\s/, '');
				};

				var sCurItem=plugin.getCurInfoItem();
				if(sCurItem){

					var vNames=xNyf.listFolders(sCurItem), vRes=[];
					for(var i in vNames){
						var xSub=new CLocalFile(sCurItem); xSub.append(vNames[i]);
						var sHint=xNyf.getFolderHint(xSub);
						var sNew=_clear_number(sHint);
						sNew=''+(parseInt(i)+1)+'. '+(sNew||'New info item ...');
						vRes[vRes.length]={sPath: ''+xSub, sHint: sNew};
					}

					if(vRes.length>0){
						var nMax=36, nTmp=0;
						var sMsg=_lc2('Confirm', 'This will auto-number the child items of the current item (like below). Proceed?')+'\n';
						for(var i in vRes){
							var sHint=vRes[i].sHint;
							if(sHint.length>nMax) sHint=sHint.substr(0, nMax)+' ...';
							sMsg+='\n';
							sMsg+=sHint;
							nTmp++;
							if(nTmp>=8){
								sMsg+='\n... ...';
								break;
							}
						}
						
						if(confirm(sMsg)){

							var nDone=0;

							for(var i in vRes){
								if(xNyf.setFolderHint(vRes[i].sPath, vRes[i].sHint)){
									nDone++;
								}
							}

							if(nDone>0){
								plugin.refreshOutline(-1, sCurItem);
							}
						}
					}else{
						alert(_lc('Prompt.Warn.NoChildInfoItems', 'No child info items available to operate.'));
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
