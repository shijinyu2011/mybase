
//sValidation=nyfjs
//sCaption=Evaluate script code
//sHint=Evaluate the selected script code from within the RTF text
//sCategory=
//sLocaleID=p.EvalScript
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

try{

	var sTxt=plugin.getSelectedText(false);
	if(!sTxt){
		var xTmpFn=new CLocalFile(platform.getTempFile()); platform.deferDeleteFile(xTmpFn);
		if(plugin.rtfStreamOut(xTmpFn, 0x0001, false)>0){
			sTxt=xTmpFn.loadText();
		}
		xTmpFn.delete();
	}

	if(sTxt){
			var sRes=eval(sTxt);
			if(sRes){
				//alert(sRes);
			}
	}else{
		alert(_lc2('NoScript', 'No script code available to evaluate.'));
	}

}catch(e){
	alert(e);
}
