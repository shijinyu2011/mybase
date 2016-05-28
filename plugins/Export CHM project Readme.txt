
myBase Nyf2Chm Converter
===========================


Introduction
===============

The Nyf2Chm Converter is a plugin written in javascript API 
for myBase Desktop v6.x. It helps export content in existing 
.nyf databases into CHM project files, so you can compile
the project files into CHM documents by utilizing Microsoft
HTML Help Workshop.

Microsoft HTML Help is the standard help system for the 
Windows platform. CHM is the HTML Help file format;
For more info about CHM, please visit:

http://en.wikipedia.org/wiki/Microsoft_Compiled_HTML_Help
http://msdn.microsoft.com/en-us/library/windows/desktop/ms670169(v=vs.85).aspx

it possible to compress HTML, graphic, and other files into a 
The HTML Help compiler (part of the HTML Help Workshop) makes 
relatively small compiled help (.chm) file, which can then be 
distributed with a software application, or downloaded from 
the Web.


Installation
==============

In order to get this plugin working with myBase Desktop 6.x, 
please simply unzip the downloaded .zip package, and then copy 
all files contained in the package into myBase's plugin folder, 
which is by default located in its install folder:

C:\Users\[username]\AppData\Local\wjjsoft\nyfedit6\plugins

Once all the contained files have been copied into the plugins 
folder, you'll need to re-launch myBase Desktop 6.x, whereby 
you can then select the 'Share - Export CHM document' menu item,
and convert your .nyf databases into CHM project files.

In order to install Microsoft HTML Help Workshop, please be sure
to first download it from on this webpage,

http://msdn.microsoft.com/en-us/library/windows/desktop/ms669985(v=vs.85).aspx

or direct link: http://go.microsoft.com/fwlink/?LinkId=14188

Run the downloaded 'htmlhelp.exe' file and follow the setup
instructions, then you can invoke HTML Help Workshop by 
selecting 'Start - All programs - HTML Help Workshop' menu item.


How it works
==============

When you select the 'Share - Export CHM project' menu item,
you'll be prompted to specify a destination folder, and select
an appropriate language from within the supported language list;
Then this utility tries to export content in the current database 
or in the current branch and save CHM project files in the folder.

If in the case you've copied HTML Help Compiler (hhc.exe) into 
the plugins folder, the complier will be invoked automatically 
and compile the CHM project files into a CHM document.

HTML Help Complier (hhc.exe )works within a DOS console window,
where the compiling progress and detailed log info will be shown.
When it's done, the DOS console window disappears immediately.

In the meanwhile you press [Yes] button to view it, or press the
[No] button, all the intermediate files will be removed from 
within the TEMP folder. If in the case that you'd want to make 
a copy of the intermediate files including .hpp/.hhc/.hhk, you'll 
need to do so just before pressing the [Yes] or [No] button.

Notes: During the CHM compiling process, please do not press the 
[Yes] nor [No] button, as the intermediate files might be still 
in use.

If the compiler (hhc.exe) not found in the plugins folder,
you'll need to load the generated project files within HTML Help 
Workshop and compile it into CHM documents manually.



Copyright 2013 Wjj Software
http://www.wjjsoft.com
support@wjjsoft.com
