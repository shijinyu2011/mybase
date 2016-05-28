
//sValidation=nyfjs
//sCaption=Export spider diagram ...
//sHint=Export outline items as a spider diagram
//sCategory=MainMenu.Share
//sLocaleID=p.ExportSpiderDiagram
//sAppVerMin=6.0.9
//sShortcutKey=

var _lc=function(sTag, sDef){return plugin.getLocaleMsg(sTag, sDef);};
var _lc2=function(sTag, sDef){return _lc(plugin.getLocaleID()+'.'+sTag, sDef);};

var _trim=function(s){return (s||'').replace(/^\s+|\s+$/g, '');};
var _trim_cr=function(s){return (s||'').replace(/\r+$/g, '');};

var _validate_filename=function(s){
	s=s||'';
	s=s.replace(/[\*\?\.\(\)\[\]\{\}\<\>\\\/\!\$\^\&\+\|,;:\"\'`~@]/g, ' ');
	s=s.replace(/\s{2,}/g, ' ');
	s=_trim(s);
	if(s.length>64) s=s.substr(0, 64);
	s=_trim(s);
	s=s.replace(/\s/g, '_');
	return s;
};

var _Bgr2Rgb=function(n){return ((n&0xff)<<16) | (n&0xff00) | ((n&0xff0000)>>16);};
var _Rgb2Bgr=function(n){return ((n&0xff)<<16) | (n&0xff00) | ((n&0xff0000)>>16);};
var _toColorRef=function(s){var n=parseInt(s.replace(/^#/i, ''), 16); return _Rgb2Bgr(n);};

{
	var clAqua			=_toColorRef('#00ffff');
	var clBlack			=_toColorRef('#000000');
	var clBlue			=_toColorRef('#0000ff');
	var clBlue2			=_toColorRef('#1c8bb9');
	var clDkGray		=_toColorRef('#808080');
	var clDkGray2		=_toColorRef('#3d4148');
	var clFuchsia		=_toColorRef('#ff00ff');
	var clGray			=_toColorRef('#c0c0c0');
	var clGreen			=_toColorRef('#008000');
	var clLime			=_toColorRef('#00ff00');
	var clLtGray		=_toColorRef('#f0f0f0');
	var clMaroon		=_toColorRef('#800000');
	var clMaroon2		=_toColorRef('#ce1820');
	var clNavy			=_toColorRef('#000080');
	var clNavy2			=_toColorRef('#3f5898');
	var clOlive			=_toColorRef('#808000');
	var clPurple		=_toColorRef('#800080');
	var clPurple2		=_toColorRef('#833b7a');
	var clRed			=_toColorRef('#ff0000');
	var clRed2			=_toColorRef('#e51b24');
	var clSilver		=_toColorRef('#c0c0c0');
	var clTeal			=_toColorRef('#008080');
	var clTeal2			=_toColorRef('#4397b1');
	var clWhite			=_toColorRef('#ffffff');
	var clYellow		=_toColorRef('#ffff00');
}

{
	//custom font settings;
	var nFontHeight=9; //9pt;
	var nEscapement=0;
	var nOrientation=0;
	var nWeight=0; //can be set to one of [0, 100, 200, ...., 900];
	var bItalic=false;
	var bUnderline=false;
	var bStrikeOut=false;
	var sFaceName='Tahoma';

	//colors that will be used to draw items in turn for each branches;
	var vColorTable=[clRed2, clNavy2, clGreen, clPurple2, clMaroon2, clTeal2, clFuchsia, clDkGray, clBlue2, clOlive, clDkGray2];

	var nFgColorLines=clBlack, nWidthLines=1; //for lines connecting items;
	var nFgColorFrames=clBlack, nWidthFrames=1; //for frames of item titles;
	var nBkColorRoot=clRed2, nFgColorRoot=clWhite; //for root item;
	var nBkColorItem=clRed2, nFgColorItem=clWhite; //for regular items;
	var nBkColorJoint=clRed2; //for joint between items and child items;

	var nMaxTitleLen=128;
	var nPaddingCanvas=20; //for canvas;
	var nMarginLeft=70, nMarginRight=0, nMarginTop=0, nMarginBottom=10; //for info items;
	var nPaddingLeft=5, nPaddingRight=4, nPaddingTop=8, nPaddingBottom=8; //for info items;
	var nIconWidth=16, nIconHeight=16, nIconMargin=4; //for icons;
}

try{

	var xNyf=new CNyfDb(-1);
	if(xNyf.isOpen()){

		var sCurItem=plugin.getCurInfoItem(-1);
		var sItemTitle=xNyf.getFolderHint(sCurItem);

		var sFnDst=platform.getSaveFileName(
			{ sTitle: ''
			, sFilter: 'PNG images (*.png)|*.png|JPEG images (*.jpg)|*.jpg|Bitmap (*.bmp)|*.bmp|All files (*.*)|*.*'
			, sDefExt: '.png'
			, bOverwritePrompt: true
			, sFilename: _validate_filename(sItemTitle)||'untitled'
			});

		if(sFnDst){

			var vDirections=[
				  _lc2('ExtendBoth', 'Extend to both left & right sides')
				, _lc2('ExtendRight', 'Extend to the right')
				, _lc2('ExtendLeft', 'Extend to the left')
				];

			var sCfgKey='ExportSpiderDiagram.iExtend';
			var sMsg=_lc2('SelDir', 'Select a direction for the diagram to extend.');
			var iDirection=dropdown(sMsg, vDirections, localStorage.getItem(sCfgKey));
			if(iDirection>=0){

				localStorage.setItem(sCfgKey, iDirection);

				var vLineStyles=[
					  _lc2('Elliptic', 'Elliptic lines')
					, _lc2('Horizontal', 'Horizontal lines')
					, _lc2('Oblique', 'Oblique lines')
					];

				sCfgKey='ExportSpiderDiagram.iLineStyle';
				sMsg=_lc2('LineStyle', 'Select a line style.');
				var iLineStyle=dropdown(sMsg, vLineStyles, localStorage.getItem(sCfgKey));
				if(iLineStyle>=0){

					localStorage.setItem(sCfgKey, iLineStyle);

					var nFolders=0;

					//To estimate the progress range;
					//xNyf.traverseOutline(sCurItem, true, function(){
					//	nFolders++;
					//});

					plugin.initProgressRange(plugin.getScriptTitle(), nFolders);

					var _traverseBranch=function(sSsgPath, iLevel, _actPre, _actPost){
						if(xNyf.folderExists(sSsgPath)){
							if(_actPre) _actPre(sSsgPath, iLevel);
							_traverseChildren(sSsgPath, iLevel+1, _actPre, _actPost);
							if(_actPost) _actPost(sSsgPath, iLevel);
						}
					};

					var _traverseChildren=function(sSsgPath, iLevel, _actPre, _actPost){
						var v=xNyf.listFolders(sSsgPath);
						for(var i in v){
							var sName=v[i];
							if(sName){
								var xSub=new CLocalFile(sSsgPath); xSub.append(sName); xSub.append('/');
								_traverseBranch(xSub, iLevel, _actPre, _actPost);
							}
						}
					};

					var _isLeaf=function(sSsgPath){
						return xNyf.getFolderCount(sSsgPath)==0;
					};

					var _isLastChild=function(sSsgPath){
						var sOwner=new CLocalFile(sSsgPath).getParent().getPath();
						var v=xNyf.listFolders(sOwner);
						if(v){
							var sName=v[v.length-1];
							var xTmp=new CLocalFile(sOwner); xTmp.append(sName); xTmp.append('/');
							return xTmp.equals(sSsgPath);
						}
						return false;
					};

					var f=new CLocalFile(sFnDst);
					var c=new CCanvas();

					var vItems=[];
					var nCanvasWidthLeft=0, nCanvasHeightLeft=0;
					var nCanvasWidthRight=0, nCanvasHeightRight=0;

					//make sure that all SSG paths contain a trailing slash,
					//so they can be saved in a dictionary/map as IDs to identify info items exactly;
					{
						var xTmp=new CLocalFile(sCurItem); xTmp.append('/');
						sCurItem=''+xTmp;
					}

					c.setFont({nHeight: nFontHeight
						, sFaceName: 'Tahoma'
						, nEscapement: nEscapement
						, nOrientation: nOrientation
						, nWeight: nWeight
						, bItalic: bItalic
						, bUnderline: bUnderline
						, bStrikeOut: bStrikeOut
						, sFaceName: sFaceName
						});

					var _init_items=function(sSsgPath, iLevel){

						var sTitle=xNyf.getFolderHint(sSsgPath); if(!sTitle) sTitle='Untitled';
						if(sTitle.length>nMaxTitleLen) sTitle=sTitle.substr(0, nMaxTitleLen);

						var iIcon=plugin.getInfoItemIcon(-1, sSsgPath);

						var v=c.drawText(sTitle, 0, 0, 0, 0, 'NOPREFIX|SINGLELINE|CALCRECT'); //CALC-RECT; Be sure to exclude VCENTER;

						var xItem={
							  sTitle: sTitle
							, nWidth: v[0]+nPaddingLeft+nPaddingRight
							, nHeight: v[1]+nPaddingTop+nPaddingBottom
							, xStart: 0
							, yStart: 0
							, iIcon: iIcon
							, nHeightBranch: 0
						};

						if(xItem.iIcon>=0){
							xItem.nWidth+=(nIconWidth+nIconMargin*2);
							xItem.nHeight=(v[1]>nIconHeight?v[1]:nIconHeight)+nPaddingTop+nPaddingBottom;
						}

						vItems[sSsgPath]=xItem;
					};

					_traverseBranch(sCurItem, 0, _init_items, null);

					var vLeft=[], vRight=[];
					{
						var v=xNyf.listFolders(sCurItem), nRight=0;
						switch(iDirection){
							case 0:
								//extend to both sides;
								nRight=Math.floor(v.length/2); if(v.length%2>0) nRight++;
								break;
							case 1:
								//extend to the right;
								nRight=v.length;
								break;
							case 2:
								//extend to the left;
								nRight=0;
								break;
						}
						for(var i in v){
							var xSsgPath=new CLocalFile(sCurItem); xSsgPath.append(v[i]); xSsgPath.append('/');
							if(i<nRight) vRight[vRight.length]=xSsgPath.toString();
							else vLeft[vLeft.length]=xSsgPath.toString();
						}
					}

					//Right side: calculate dimision for leaf items, and width for each items;
					var _pre_calc_dim_right=function(sSsgPath, iLevel){
						var xItem=vItems[sSsgPath];
						if(xItem){

							var sOwner=new CLocalFile(sSsgPath).getParent().getPath();
							var xOwner=vItems[sOwner];
							if(xOwner){
								xItem.xStart=xOwner.xStart+xOwner.nWidth+nMarginLeft;
							}

							//for leaf nodes;
							if(_isLeaf(sSsgPath)){
								xItem.yStart=nCanvasHeightRight;

								nCanvasHeightRight+=(xItem.nHeight+nPaddingTop+nPaddingBottom);

								if(_isLastChild(sSsgPath)){
									nCanvasHeightRight+=nMarginBottom;
								}

								var nMax=xItem.xStart+xItem.nWidth;
								if(nMax>nCanvasWidthRight){
									nCanvasWidthRight=nMax;
								}
							}
						}
					};

					for(var i in vRight){
						var sSsgPath=vRight[i];
						_traverseBranch(sSsgPath, 0, _pre_calc_dim_right, null);
					}

					if(vRight.length==0){
						//2012.7.5 consider that the root item is by default located at (0, 0) and extends to the right;
						//so, when the diagram extends to the left, the root item would be out of sight unless it moves to the left for its text width;
						//this offset must be prior to calculating dimensions for the left side, so all the xStart can be adjusted accordingly;
						var xRoot=vItems[sCurItem];
						if(xRoot) xRoot.xStart-=xRoot.nWidth;
					}

					//Left side: calculate dimision for leaf items, and width for each items;
					var _pre_calc_dim_left=function(sSsgPath, iLevel){
						var xItem=vItems[sSsgPath];
						if(xItem){

							var sOwner=new CLocalFile(sSsgPath).getParent().getPath();
							var xOwner=vItems[sOwner];
							if(xOwner){
								xItem.xStart=xOwner.xStart-xItem.nWidth-nMarginLeft;
							}

							//for leaf nodes;
							if(_isLeaf(sSsgPath)){
								xItem.yStart=nCanvasHeightLeft;

								nCanvasHeightLeft+=(xItem.nHeight+nPaddingTop+nPaddingBottom);

								if(_isLastChild(sSsgPath)){
									nCanvasHeightLeft+=nMarginBottom;
								}

								var nMax=xItem.xStart;
								if(nMax<nCanvasWidthLeft){
									nCanvasWidthLeft=nMax;
								}
							}
						}
					};

					for(var i in vLeft){
						var sSsgPath=vLeft[i];
						_traverseBranch(sSsgPath, 0, _pre_calc_dim_left, null);
					}

					var nCanvasWidth=nCanvasWidthRight-nCanvasWidthLeft;
					var nCanvasHeight=nCanvasHeightLeft>nCanvasHeightRight ? nCanvasHeightLeft : nCanvasHeightRight;

					var nHeightDiff=Math.abs(nCanvasHeightLeft-nCanvasHeightRight);
					var nHeightOffsetLeft=0, nHeightOffsetRight=0;
					if(nCanvasHeightLeft>nCanvasHeightRight){
						nHeightOffsetRight=nHeightDiff/2;
					}else{
						nHeightOffsetLeft=nHeightDiff/2;
					}

					//Vertical dimension: calculate the vertical coordinates for each non-leaf items;
					var _post_calc_dim=function(sSsgPath, iLevel){
						var xItem=vItems[sSsgPath];
						if(xItem){

							//adjust the top margin space for the small tree block;
							var bLeftSide=(xItem.xStart<0);
							xItem.yStart+=(bLeftSide ? nHeightOffsetLeft : nHeightOffsetRight);

							if(iLevel==0){
								//for root item to center vertically;
								xItem.yStart=(nCanvasHeight-xItem.nHeight)/2;
							}else if(!_isLeaf(sSsgPath)){
								var v=xNyf.listFolders(sSsgPath);
								if(v && v.length>0){
									var y1=0;
									{
										var xSub=new CLocalFile(sSsgPath); xSub.append(v[0]); xSub.append('/');
										var xTmp=vItems[xSub.getPath()];
										if(xTmp) y1=xTmp.yStart;
									}
									if(v.length>1){
										var y2=0;
										{
											var xSub=new CLocalFile(sSsgPath); xSub.append(v[v.length-1]); xSub.append('/');
											var xTmp=vItems[xSub.getPath()];
											if(xTmp) y2=xTmp.yStart;
										}
										xItem.yStart=(y1+y2)/2;
									}else{
										xItem.yStart=y1;
									}
								}
							}
						}
					};

					_traverseBranch(sCurItem, 0, null, _post_calc_dim);

					//alert(nCanvasWidth + ' * ' + nCanvasHeight);

					nCanvasWidth+=nPaddingCanvas*2;
					nCanvasHeight+=nPaddingCanvas*2-nMarginBottom;

					c.setCanvasSize(nCanvasWidth, nCanvasHeight);
					c.setViewportOrg(-nCanvasWidthLeft+nPaddingCanvas, 0+nPaddingCanvas+nMarginBottom/2);

					var nBranches=0;
					var _draw_line=function(sSsgPath, iLevel){

						if(xNyf.folderExists(sSsgPath, false)){

							var xItem=vItems[sSsgPath];
							if(xItem){

								var bContinue=plugin.ctrlProgressBar(xItem.sTitle, 1, true);
								if(!bContinue) return true;

								var bLeftSide=(xItem.xStart<0);
								var nFixHori=bLeftSide ? 1 : 0;

								//a differenct color for item in each level;
								//nFgColorFrames=vColorTable[iLevel%vColorTable.length];

								//draw lines with a different color for each sub branch;
								if(iLevel==1){
									nBkColorItem=nFgColorLines=vColorTable[(nBranches++)%vColorTable.length];
								}

								if(iLevel==0){
									c.setPen('SOLID', nWidthFrames, nFgColorFrames);
									c.setBrushColor(nBkColorRoot);
									//c.arc(xItem.xStart, xItem.yStart-xItem.nHeight/2, xItem.xStart+xItem.nWidth, xItem.yStart+xItem.nHeight*3/2);
									c.drawRoundRect(xItem.xStart+nFixHori, xItem.yStart, xItem.xStart+xItem.nWidth+nFixHori, xItem.yStart+xItem.nHeight, 8, 8);
								}else{
									if(
										   iLineStyle==0
										//|| (iLineStyle==1 && iLevel==0)
										|| (iLineStyle==1)
										|| iLineStyle==2
									){
										c.setPen('SOLID', nWidthFrames, nFgColorFrames);
										c.setBrushColor(iLevel==0 ? nBkColorRoot : nBkColorItem);
										c.drawRoundRect(xItem.xStart+nFixHori, xItem.yStart, xItem.xStart+xItem.nWidth+nFixHori, xItem.yStart+xItem.nHeight, 8, 8);
									}
								}

								var sOwner=new CLocalFile(sSsgPath).getParent().getPath();
								var xOwner=vItems[sOwner];
								if(xOwner){

									c.setPen('SOLID', nWidthLines, nFgColorLines);

									switch(iLineStyle){
										case 0:
											//elliptic lines
											var xFrom, yFrom, xTo, yTo;
											var dx=Math.floor(nMarginLeft/5), dx2=Math.floor(nMarginLeft/5);
											var r=Math.floor(nFontHeight/5); r=(r<2)?2:r; //r=Math.floor(nMarginLeft/16);
											if(bLeftSide){
												xFrom=xOwner.xStart, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/2);
												xTo=xItem.xStart+xItem.nWidth, yTo=xItem.yStart+Math.floor(xItem.nHeight/2);

												c.moveTo(xFrom, yFrom);
												xFrom-=dx;
												c.lineTo(xFrom, yFrom);

												xTo+=dx2;

												var x1=xTo-(xFrom-xTo), y1=yTo;
												var x2=xFrom, y2=(yFrom-yTo)*2+yTo;
												if(yTo>yFrom){
													c.arc(x1, y1, x2, y2, xTo, yTo, xFrom, yFrom);
												}else if(yTo<yFrom){
													c.arc(x1, y1, x2, y2, xFrom, yFrom, xTo, yTo);
												}else{
													c.moveTo(xFrom, yFrom);
													c.lineTo(xTo, yTo);
												}

												xTo--;
												c.moveTo(xTo, yTo);
												c.lineTo(xTo-dx2, yTo);

												var x=xFrom, y=yFrom;
												c.setBrushColor(nBkColorJoint);
												c.drawRect(x-r, y-r, x+r, y+r);
											}else{
												xFrom=xOwner.xStart+xOwner.nWidth, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/2);
												xTo=xItem.xStart, yTo=xItem.yStart+Math.floor(xItem.nHeight/2);

												c.moveTo(xFrom, yFrom);
												xFrom+=dx;
												c.lineTo(xFrom, yFrom);

												xTo-=dx2;

												var x1=xTo-(xFrom-xTo), y1=yTo;
												var x2=xFrom, y2=(yFrom-yTo)*2+yTo;
												if(yTo>yFrom){
													yTo--;
													c.arc(x1, y1, x2, y2, xFrom, yFrom, xTo, yTo);
												}else if(yTo<yFrom){
													c.arc(x1, y1, x2, y2, xTo, yTo, xFrom, yFrom);
												}else{
													c.moveTo(xFrom, yFrom);
													c.lineTo(xTo, yTo);
												}

												c.moveTo(xTo, yTo);
												c.lineTo(xTo+dx2, yTo);

												var x=xFrom, y=yFrom;
												c.setBrushColor(nBkColorJoint);
												c.drawRect(x-r, y-r, x+r, y+r);
											}
											break;
										case 1:
											//horizontal lines
											var xFrom, yFrom, xTo, yTo;
											var dx=Math.floor(nMarginLeft/5);
											var r=Math.floor(nFontHeight/5); r=(r<2)?2:r; //r=Math.floor(nMarginLeft/16);
											if(bLeftSide){
												xFrom=xOwner.xStart, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/((iLevel==1)?2:1));
												xTo=xItem.xStart+xItem.nWidth, yTo=xItem.yStart+xItem.nHeight;
												c.moveTo(xFrom, yFrom);
												c.lineTo(xTo+dx, yFrom);
												c.lineTo(xTo+dx, yTo);
												c.lineTo(xTo-xItem.nWidth, yTo);

												var x=xTo+dx, y=yFrom;
												c.setBrushColor(nBkColorJoint);
												c.drawRect(x-r, y-r, x+r, y+r);
											}else{
												xFrom=xOwner.xStart+xOwner.nWidth, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/((iLevel==1)?2:1));
												xTo=xItem.xStart, yTo=xItem.yStart+xItem.nHeight;
												c.moveTo(xFrom, yFrom);
												c.lineTo(xTo-dx, yFrom);
												c.lineTo(xTo-dx, yTo);
												c.lineTo(xTo+xItem.nWidth, yTo);

												var x=xTo-dx, y=yFrom;
												c.setBrushColor(nBkColorJoint);
												c.drawRect(x-r, y-r, x+r, y+r);
											}
											break;
										case 2:
											//oblique lines
											var xFrom, yFrom, xTo, yTo;
											if(bLeftSide){
												xFrom=xOwner.xStart, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/2);
												xTo=xItem.xStart+xItem.nWidth, yTo=xItem.yStart+Math.floor(xItem.nHeight/2);
												if(iLevel==1 && iDirection==0){
													if(yTo<xOwner.yStart){
														//above the owner;
														yFrom=xOwner.yStart;
														xFrom=xOwner.xStart+Math.floor(xOwner.nWidth/3);
													}else if(yTo>xOwner.yStart+xOwner.nHeight){
														yFrom=xOwner.yStart+xOwner.nHeight;
														xFrom=xOwner.xStart+Math.floor(xOwner.nWidth/3);
													}
												}
											}else{
												xFrom=xOwner.xStart+xOwner.nWidth, yFrom=xOwner.yStart+Math.floor(xOwner.nHeight/2);
												xTo=xItem.xStart, yTo=xItem.yStart+Math.floor(xItem.nHeight/2);
												if(iLevel==1 && iDirection==0){
													if(yTo<xOwner.yStart){
														//above the owner;
														yFrom=xOwner.yStart;
														xFrom=xOwner.xStart+Math.floor(xOwner.nWidth/3)*2;
													}else if(yTo>xOwner.yStart+xOwner.nHeight){
														yFrom=xOwner.yStart+xOwner.nHeight;
														xFrom=xOwner.xStart+Math.floor(xOwner.nWidth/3)*2;
													}
												}
											}
											c.moveTo(xFrom, yFrom);
											c.lineTo(xTo, yTo);
											break;
										case -1:
											break;
									}
								}
							}

						}
					};

					_traverseBranch(sCurItem, 0, _draw_line, null);

					var xIconFiles={}, nBranches=0;
					var _draw_item=function(sSsgPath, iLevel){

						if(xNyf.folderExists(sSsgPath, false)){

							var xItem=vItems[sSsgPath];
							if(xItem){

								var bContinue=plugin.ctrlProgressBar(xItem.sTitle, 1, true);
								if(!bContinue) return true;

								var bLeftSide=(xItem.xStart<0);
								var nFixHori=bLeftSide ? 1 : 0;

								var x=xItem.xStart+nFixHori;
								var y=xItem.yStart;

								if(xItem.iIcon>=0){
									x+=(nIconWidth+nIconMargin*2);
								}

								//a differenct color for items within each level;
								//nFgColorLines=nFgColorItem=vColorTable[iLevel%vColorTable.length];

								//draw item titles with a different color for each sub branch;
								if(iLevel==1){
									nFgColorLines=vColorTable[ (nBranches++) % vColorTable.length ];
								}

								c.setTextColor( (iLevel==0) ? nFgColorRoot : nFgColorItem );

								c.drawText(xItem.sTitle, x+nPaddingLeft, y, xItem.nWidth, xItem.nHeight, 'NOPREFIX|LEFT|VCENTER|SINGLELINE');

								//draw icons;
								if(xItem.iIcon>=0){
									var sIconFn=xIconFiles[xItem.iIcon];
									if(!sIconFn){
										var xSsgFn=new CLocalFile(plugin.getDefRootContainer()); xSsgFn.append(xItem.iIcon.toString(16)+'.bmp');
										var xTmpFn=new CLocalFile(platform.getTempFile()); platform.deferDeleteFile(xTmpFn);
										if(xNyf.exportFile(xSsgFn, xTmpFn)>0){
											sIconFn=xTmpFn.toString();
											xIconFiles[xItem.iIcon]=sIconFn;
										}
									}
									if(sIconFn){
										x=xItem.xStart+nIconMargin+nFixHori;
										y=xItem.yStart+(xItem.nHeight-nIconHeight)/2;
										c.drawBitmap(sIconFn, x, y, nIconWidth, nIconHeight); //c.drawImage(sIconFn, x, y);
									}
								}

							}

						}
					};

					_traverseBranch(sCurItem, 0, _draw_item, null);

					plugin.ctrlProgressBar('Saving image', 1, false);

					var sExt=f.getExtension(false).replace(/\./ig, '').toUpperCase();

					var nJpegQuality=90;
					if(c.saveAs(f, sExt, nJpegQuality)){
						var sMsg=_lc2('Done', 'Successfully generated the spider diagram. View it now?');
						if(confirm(sMsg+'\n\n'+f)){
							f.launch('open');
						}
					}else{
						alert(_lc2('Fail.Save', 'Failed to save the spider diagram.'));
					}

				}
			}
		}

	}else{
		alert(_lc('Prompt.Warn.NoDbOpened', 'No database is currently opened.'));
	}

}catch(e){
	alert(e);
}
