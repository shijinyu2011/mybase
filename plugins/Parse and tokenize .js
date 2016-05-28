
//sValidation=nyfjs
//sCaption=Parse and tokenize ...
//sHint=Parse file content and tokenize, and then show results in a textbox
//sCategory=MainMenu.Attachments
//sLocaleID=p.ParseTokenize
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

try{
	var sRes=plugin.getSelectedAttachments('\t')||'';
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
				var sExt=xSsgFn.getExtension();
				var xTmpFn=new CLocalFile(platform.getTempFile('', '', sExt)); platform.deferDeleteFile(xTmpFn);
				if(xNyf.exportFile(xSsgFn, xTmpFn)>0){
					s=platform.parseFile(xTmpFn, sExt)||'';
					textbox({sTitle: ''
						, sDescr: _lc2('Descr', 'Text extracted from file:')+' '+sSsgName
						, sDefTxt: platform.tokenizeText(s, ', ')
						, bReadonly: true
						, bWordwrap: false
					});
				}
				xTmpFn.delete();
			}
		}
	}
}catch(e){
	alert(e);
}
