
//sValidation=nyfjs
//sCaption=Open shortcut folder
//sHint=Open folder location for the currently selected shortcut
//sCategory=MainMenu.Attachments
//sLocaleID=p.OpenShortcutFolder
//sAppVerMin=6.0
//sShortcutKey=


var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

try{

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

	var sRes=plugin.getSelectedAttachments('\t')||'', nLinks=0;
	if(sRes){
		var vLines=sRes.split('\n');
		for(var i in vLines){
			var s=vLines[i]||'';
			var v=s.split('\t');
			var sDbPath=v[0], sSsgPath=v[1], sSsgName=v[2];
			var iDbPos=plugin.getDbIndex(sDbPath);
			if(iDbPos>=0){
				var xNyf=new CNyfDb(iDbPos);
				var xSsgFn=new CLocalFile(sSsgPath); xSsgFn.append(sSsgName);
				if(xNyf.isShortcut(xSsgFn)){
					nLinks++;
					var sSrc=_srcfn_of_shortcut(xNyf, xSsgFn);
					if(sSrc){
						if(sSrc.match(/^\./)){
							var xPath=new CLocalFile(xNyf.getDbFile());
							xPath=new CLocalFile(xPath.getDirectory());
							xPath.append(sSrc);
							sSrc=''+xPath;
						}
						var sDir=new CLocalFile(sSrc).getDirectory();
						var bSucc=platform.shellExecute('open', sDir, '', '.\\', false);
						if(bSucc){
							break;
						}
					}
				}
			}
		}
	}
	if(nLinks<=0){
		alert(_lc2('NotShortcut', 'No shortcut entry is currently selected.'));
	}
}catch(e){
	alert(e);
}
