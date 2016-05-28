
//sValidation=nyfjs
//sCaption=Import OPML items ...
//sHint=Import items from within OPML document
//sCategory=MainMenu.Capture
//sLocaleID=p.ImportOpml
//sAppVerMin=6.1.1
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

try{
	var xNyf=new CNyfDb(-1);

	if(xNyf.isOpen()){

		if(!xNyf.isReadonly()){

			var sSrcFn=platform.getOpenFileName(
				{ sTitle: ''
				, sFilter: 'OPML Documents (*.opml;*.xml)|*.opml;*.xml|All files (*.*)|*.*'
				, bMultiSelect: false
				, bHideReadonly: true
				});

			if(sSrcFn){

				plugin.initProgressRange(plugin.getScriptTitle());

				var sCurItem=plugin.getCurInfoItem(-1), nDone=0;

				if(!sCurItem) sCurItem=plugin.getDefRootContainer();

				var _find_unique_id=function(sSsgPath){
					return xNyf.getChildEntry(sSsgPath, 0);
				};

				var _import_branch=function(sSsgPath, xElm){

					/*
					var sNotes=xElm.getAttrValue('description');
					var sTitle=xElm.getAttrValue('title');
					if(!sTitle) sTitle=xElm.getAttrValue('text');
					if(!sTitle) sTitle='Untitled';
					*/

					var sNotes='', sNotes2='', sTitle='';
					var c=xElm.getAttrCount();
					for(var i=0; i<c; ++i){
						var sName=xElm.getAttrName(i);
						var sVal=xElm.getAttrValue(sName);
						if(sName && sVal){

							if(sNotes) sNotes+='\r\n';
							sNotes+=(sName + ' =' + sVal);

							if(sName=='title' || sName=='text'){
								if(!sTitle) sTitle=sVal;
							}else{
								if(sNotes2) sNotes2+='\r\n';
								sNotes2+=(sName + ' =' + sVal);
							}
						}
					}

					//exclude the 'title' and 'text' fields;
					//if(!sNotes2) sNotes=''; else sNotes=sNotes2;

					plugin.ctrlProgressBar(sTitle);

					var xPathSub=new CLocalFile(sSsgPath); xPathSub.append(_find_unique_id(sSsgPath));

					if(xNyf.createFolder(xPathSub)){

						if(sTitle) xNyf.setFolderHint(xPathSub, sTitle);

						var xSsgFn=new CLocalFile(xPathSub); xSsgFn.append(plugin.getDefNoteFn());
						var nBytes=xNyf.createTextFile(xSsgFn, sNotes);

						_import_subitems(xPathSub, xElm);
					}
				};

				var _import_subitems=function(sSsgPath, xElm){
					var nChild=xElm.getElementCount();
					for(var i=0; i<nChild; ++i){
						var xSub=xElm.getElementByIndex(i);
						if(xSub.getTagName()=='outline'){
							_import_branch(sSsgPath, xSub);
						}
					}
				};

				//var nDone=0;
				var sXml=new CLocalFile(sSrcFn).loadText();
				if(sXml){
						var xml=new CXmlDocument();
						xml.init(sXml);

						var xHd=xml.getElementByPath('opml/head');
						var xBd=xml.getElementByPath('opml/body');

						//_import_head(sCurItem, xHd);

						_import_subitems(sCurItem, xBd);

						//if(nDone>0)
						{
							plugin.refreshOutline(-1, sCurItem);
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
