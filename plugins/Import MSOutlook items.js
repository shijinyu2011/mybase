
//sValidation=nyfjs
//sCaption=Import MSOutlook items ...
//sHint=Import selected items from within Microsoft Outlook
//sCategory=MainMenu.Capture
//sLocaleID=p.ImportOutlookItems
//sAppVerMin=6.0
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

try{
	var xNyf=new CNyfDb(-1);
	if(xNyf.isOpen()){

		if(!xNyf.isReadonly()){

			var sCurItem=plugin.getCurInfoItem()||plugin.getDefRootContainer();
			if(sCurItem){

				var sMsg=_lc2('Starting', 'Starting to import Microsoft Outlook items. Please launch Outlook and be sure to select items thereby before importing. Ready?');
				if(confirm(sMsg)){

					var _find_unique_id=function(sSsgPath){
						return xNyf.getChildEntry(sSsgPath, 0);
					};

					var _detect_linked_objs=function(s, sTag, vObjs){
						if(s && sTag){
							//2011.8.20 '\s' seems not to function within the [...] operator, so replace it with ' \t';

							//2012.7.30 consider all 3 possible formats of the linked objects;
							var vRE=[
								  '=\"(.+?)\"'				//src="abc def.jpg"
								, '=\'(.+?)\''				//src='abc def.jpg'
								//2013.11.2 this may produce some mismatches;
								//, '=(?!\"|\')(.+?)[> \t]'		//src=abc.jpg, spaces not allowed;
							];
							for(var i in vRE){
								var re=new RegExp(sTag+vRE[i], 'ig'), v=[];
								while(v=re.exec(s)){
									if(v && v.length>1){
										//2011.8.21 in case of empty filenames which would cause problems, like this: herf="" or src='';
										//2013.11.12 for outlook-2000 embedded images: <IMG src="cid:687392502@12112013-049d">
										//2013.11.12 for outlook-2010 embedded images: <img width=226 height=261 src="~jj4D4A_files/image003.jpg" v:shapes="Picture_x0020_2">
										var sObj=v[1].replace(/[\'\"]/g, '');
										//if(sObj.match(/^(cid:|~)/))
										{
											if(vObjs.indexOf(sObj)<0){
												vObjs.push(sObj);
											}
										}
									}
								}
							}
						}
					};

					//2013.11.13 Strange things: Outlook embedded images with different filenames, appearing in multiple xHtml tags;
					//<v:imagedata src="~jj5C7A_files/image001.jpg" o:href="cid:image003.jpg@01CEDF8C.24786AD0"/>
					//<![if !vml]><img width=385 height=326 src="~jj5C7A_files/image001.jpg" v:shapes="Picture_x0020_1"><![endif]>
					//Therefore, only just look into the <img ...> tag for linked image filenames;
					var _detect_linked_imgs=function(s, vObjs){
						if(s && vObjs){
							var sImgElmLine='', sTag='<img ';
							while(s){
								var p=s.indexOf(sTag); if(p<0) p=s.indexOf(sTag.toUpperCase());
								if(p<0) break;
								s=s.substr(p+sTag.length);
								p=s.indexOf('>');
								if(p>0){
									sImgElmLine=s.substr(0, p);
									s=s.substr(p+1);
								}else if(p<0){
									sImgElmLine=s;
									s='';
								}
								if(sImgElmLine){
									_detect_linked_objs(sImgElmLine, 'src', vObjs);
								}
							}
						}
					};

					var _remove_base_tag=function(s){
						if(s){
							var sTag='<base ', sRes='';
							while(s){
								var p=s.indexOf(sTag); if(p<0) p=s.indexOf(sTag.toUpperCase());
								if(p>=0){
									sRes+=s.substr(0, p);
									s=s.substr(p+sTag.length);
									p=s.indexOf('>');
									if(p>=0){
										s=s.substr(p+1);
									}else{
										break;
									}
								}else{
									sRes+=s;
									break;
								}
							}
						}
						return sRes;
					};

					plugin.initProgressRange(plugin.getScriptTitle());

					var xMsol=new CAppOutlook();
					if(xMsol){

						var bQuit=false;

						try{
							var ns=xMsol.getNameSpace('MAPI');
							ns.logon();

							var xExp;
							try{
								xExp=xMsol.getActiveExplorer();
							}catch(e){
								bQuit=true;
							}

							if(xExp){

								var xSel;
								try{
									xSel=xExp.getSelection();
								}catch(e){
								}

								if(xSel){

									var nSel=xSel.getCount(), nDone=0;

									if(nSel>0){

										plugin.initProgressRange(plugin.getScriptTitle(), nSel);

										for(var j=0; j<nSel; ++j){
											var xItem=xSel.getItem(j+1);
											if(xItem){
												var sSubject=xItem.getSubject();

												var bContinue=plugin.ctrlProgressBar(sSubject || '***', 1, true);
												if(!bContinue) break;

												var sTmpFn=new CLocalFile(platform.getTempFile('', '', '.tmp')); platform.deferDeleteFile(sTmpFn);

												var bHtml=false, iSaveAs=1; //olRTF:1
												if(xItem.getClass()==43){ //olMail:43
													iSaveAs=5; //olHTML:5
													bHtml=true;
												}
//var sLog='';
												var vImgs=[];
												try{
													xItem.saveAs(sTmpFn, iSaveAs);

													//2013.11.12 tries to relocate the image links;
													var xTmpFn=new CLocalFile(sTmpFn);
													if(xTmpFn.exists()){
														var sHtml0=xTmpFn.loadText(), sHtml=sHtml0;

														//2013.11.14 remove all <BASE ...> tags;
														sHtml=_remove_base_tag(sHtml);

														_detect_linked_imgs(sHtml, vImgs);
														//_detect_linked_imgs(sHtml, vImgs);
//sLog+='vImgs0: '+vImgs;
														for(var i in vImgs){

															var sImgFn=vImgs[i];

															//2013.11.12 embedded images: cid:687392502@12112013-049d
															var xImgFn=new CLocalFile(sImgFn.replace(/[\:]/g, '-'));
															var sLeafName=xImgFn.getLeafName().replace(/[\:\@]/g, '-');

															if(sLeafName!=sImgFn){
																var sPat=sImgFn.replace(/[\:\.\[\]\~\/\\]/g, function(w){return '\\'+w;});
																var xRE=new RegExp(sPat, 'g');

																sHtml=sHtml.replace(xRE, sLeafName);
																vImgs[i]=sLeafName; //keep it for below reference;
															}
														}
														if(sHtml!=sHtml0){
															xTmpFn.saveAnsi(sHtml);
														}
//sLog+='\n\nvImgs1: '+vImgs;
													}
												}catch(e){
													xItem.saveAs(sTmpFn, 0); //olTXT:0
													bHtml=false;
												}

												var xChild=new CLocalFile(sCurItem); xChild.append(_find_unique_id(sCurItem));
												if(xNyf.createFolder(xChild)){
													xNyf.setFolderHint(xChild, sSubject);
													var xSsgFn=new CLocalFile(xChild);

													if(bHtml){
														xSsgFn.append('_olitem.html');
													}else{
														xSsgFn.append(plugin.getDefNoteFn());
													}

													var nBytes=xNyf.createFile(xSsgFn, sTmpFn);

													sTmpFn.delete();

													if(nBytes>=0){

														nDone++;

														//import attachments if any;
														var xFiles;
														try{
															xFiles=xItem.getAttachments();
														}catch(e){
														}

														if(xFiles){
															var nFiles=xFiles.getCount();
//sLog+='\n\nnFiles='+nFiles;
															for(var i=0; i<nFiles; ++i){
																var xFile=xFiles.getItem(i+1);
																var sFn=xFile ? xFile.getFileName() : '';

																//2013.11.12 embedded images may always return the 'Outlook.bmp' tag;
																if(sFn=='Outlook.bmp'){
																	if(i<vImgs.length){
																		sFn=vImgs[i];
																	}else{
																		sFn='Outlook_'+i+'.bmp';
																	}
																}else{
																	//2013.11.13 forcedly apply the filenames extracted from <img> tags;
																	//as Outlook::attachments may give different names than that are linked in HTML tags.
																	if(i<vImgs.length){
																		sFn=vImgs[i];
																	}
																}

																if(xFile && sFn){
																	xFile.saveAsFile(sTmpFn);
																	xSsgFn=new CLocalFile(xChild); xSsgFn.append(sFn);
																	nBytes=xNyf.createFile(xSsgFn, sTmpFn);
//sLog+='\n'+xSsgFn
																}
															}
														}
														
													}else{
														if(j<nSel-1 && !confirm(_lc2('Fail.GoAnyway', 'Failed to import the item. Continue with next?')+'\n\n'+sSubject)){
															break;
														}
													}
												}

											}
										}
//alert(sLog+'\n\nPlease simply press Ctrl+C to copy the content, then paste into an email and send to us for debug.');
										if(nDone>0){
											plugin.refreshOutline(-1, sCurItem);
										}

										sMsg=_lc2('Done', 'Total %nCount% item(s) successfully inserted.');
										sMsg=sMsg.replace(/%nCount%/gi, ''+nDone);
										alert(sMsg);

									}else{
										alert('No items currently selected within Microsoft Outlook.');
									}
								}else{
									alert('The selection is currently not available.');
								}
							}else{
								alert(_lc2('Launch', 'Please be sure to launch Microsoft Outlook and select some items before importing.'));
							}

							ns.logoff();

						}catch(e){
							alert(e);
						}
					}else{
						alert(_lc('p.Common.Fail.LoadMSOutlook', 'Failed to invoke Microsoft Outlook.'));
					}

					if(bQuit) xMsol.quit();
				}

			}else{
				alert(_lc('Prompt.Warn.NoInfoItemSelected', 'No info item is currently selected.'));
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
