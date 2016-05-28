
//sValidation=nyfjs
//sCaption=Edit keyboard shortcuts
//sHint=Edit the keyboard shortcut INI file within Notepad
//sCategory=MainMenu.Plugins
//sLocaleID=p.EditHotkeys
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

var sMsg=_lc2('Confirm', 'Loading/editing the keyboard shortcuts .ini file, Proceed?\n\nNote that any changes to the INI file will not take effect unless re-launching.');
sMsg=sMsg.replace(/\\n/gi, '\n');

if(confirm(sMsg)){
	var xFn=new CLocalFile(plugin.getShortcutFile());
	xFn.launch();
}
