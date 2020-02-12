//
//  search.integration.mod.js
//  Recipe Search Integration Core
//  Version 1.2.2
//
//  Created by Hutchins, Andrew on 2012-10-03.
//  Copyright 2012 Scripps Networks Interactive. All rights reserved.
//
//  Modified: Wednesday February 27, 2013 at 12:29:47
//

// Debugging Console (Fixes IE also.)
if (!window.console) {
  (function() {
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    window.console = {};
    for (var i = 0; i < names.length; ++i) {
      window.console[names[i]] = function() {};
    }
  }());
}

///////////////////////
// BEGIN HTTP OBJECT //
///////////////////////

// Make sure we haven't already been loaded
var CDEHttp;
if (CDEHttp && (typeof CDEHttp != 'object' || CDEHttp.NAME)) throw new Error("Namespace 'CDEHttp' already exists");

// Create our namespace, and specify some meta-information
CDEHttp = {};
CDEHttp.NAME = 'CDEHttp';    // The name of this namespace
CDEHttp.VERSION = 1.0;    // The version of this namespace
CDEHttp.DEBUG = false; // true to enable logging calls.

// This is a list of XMLHttpRequest creation factory functions to try
CDEHttp._factories = [
    function() { return new XMLHttpRequest(); },
    function() { return new ActiveXObject('Msxml2.XMLHTTP'); },
    function() { return new ActiveXObject('Microsoft.XMLHTTP'); }
];

// When we find a factory that works, store it here
CDEHttp._factory = null;

CDEHttp.newRequest = function() {
    if (CDEHttp._factory != null) return CDEHttp._factory();
    for(var i = 0; i < CDEHttp._factories.length; i++) {
        try {
            var factory = CDEHttp._factories[i];
            var request = factory();
            if (request != null) {
                CDEHttp._factory = factory;
                return request;
            }
        }
        catch(e) {continue;}
    }
    CDEHttp._factory = function() {throw new Error('XMLHttpRequest not supported');}
    CDEHttp._factory();
};

CDEHttp.getXML = function(url, callback) {
    var request = CDEHttp.newRequest();
    request.onreadystatechange = function() {if (request.readyState == 4 && request.status == 200) callback(request.responseXML);}
    request.open('GET', url);
    request.send(null);
};

CDEHttp.getNodesLength = function(pResponseXML, pNodeName) {return pResponseXML.documentElement.getElementsByTagName(pNodeName).length;};

CDEHttp.getNodeValue = function(pResponseXML, pNodeName, pNodeIndex) {
    if (pNodeIndex) {
        try {
            return pResponseXML.documentElement.getElementsByTagName(pNodeName)[pNodeIndex].firstChild.nodeValue;
        } catch(e) {}
    } else {
        try {
            return pResponseXML.documentElement.getElementsByTagName(pNodeName)[0].firstChild.nodeValue;
        } catch(e) {}
    }
};

CDEHttp.getNodeAttributesLength = function(pResponseXML, pNodeName, pNodeIndex) {
  var mIndex = 0;
  if (pNodeIndex) mIndex = pNodeIndex;
  return pResponseXML.documentElement.getElementsByTagName(pNodeName)[mIndex].attributes.length;
};

CDEHttp.getNodeAttributes = function(pResponseXML, pNodeName, pNodeIndex) {
  var mIndex = 0;
  var mNode = null;
  var pOutput = [];
  if (pNodeIndex) mIndex = pNodeIndex;
  mNode = pResponseXML.documentElement.getElementsByTagName(pNodeName)[mIndex];
  if (mNode.attributes.length > 0) {
    for (var i=0; i<mNode.attributes.length; i++) {pOutput.push(mNode.attributes.item(i).nodeName);}
  } else {throw new Error('No attributes found');}
  return pOutput;
};

CDEHttp.getNodeAttributeValue = function(pResponseXML, pNodeName, pNodeIndex, pAttribute) {
  if (!pAttribute) {throw new Error('Need attribute name to get the value'); return;}
  var mIndex = 0;
  var mNode = null;
  var pOutput = [];
  if (pNodeIndex) mIndex = pNodeIndex;
  mNode = pResponseXML.documentElement.getElementsByTagName(pNodeName)[mIndex];
  if (mNode) {
    if (mNode.attributes.length > 0) {
      for (var i=0; i<mNode.attributes.length; i++) {
        if (mNode.attributes.item(i).nodeName == pAttribute) {
          try {return mNode.attributes.item(i).nodeValue;} catch(e) {}
        }
      }
    } else {throw new Error('No attributes found');}
  }
};

/////////////////////
// END HTTP OBJECT //
/////////////////////

/////////////////////////////
// BEGIN DROPSHADOW OBJECT //
/////////////////////////////
function CDEShadow(pElementID, pColor, pDistance, pDegrees, pSteps, pStartOpacity, pEndOpacity) {
  if ( !pElementID ){
    return;
  }
  this._element = document.getElementById(pElementID);
  this.mWidth = this._element.offsetWidth;
  this.mHeight = this._element.offsetHeight;
  this.mBackgroundImage = '';
  this.mBackgroundColor = '';
  this.mElementZIndex = 0;
  if ( !this.mWidth || !this.mHeight || isNaN(pDistance) || isNaN(pDegrees) || isNaN(pSteps) || isNaN(pStartOpacity) || isNaN(pEndOpacity) ) {
    return;
  }
  // check to see if there is a background image
  if (document.all) {
    if (this._element.currentStyle) {
      this.mBackgroundImage = this._element.currentStyle['backgroundImage'];
    } else if (window.getComputedStyle) {
      this.mBackgroundImage = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('backgroundImage');
    }
  } else {
    if (this._element.currentStyle) {
      this.mBackgroundImage = this._element.currentStyle['background-image'];
    } else if (window.getComputedStyle) {
      this.mBackgroundImage = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('background-image');
    }
  }
  // check to see if there is a background color
  if (document.all) {
    if (this._element.currentStyle) {
      this.mBackgroundColor = this._element.currentStyle['backgroundColor'];
    } else if (window.getComputedStyle) {
      this.mBackgroundColor = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('backgroundColor');
    }
  } else {
    if (this._element.currentStyle) {
      this.mBackgroundColor = this._element.currentStyle['background-color'];
    } else if (window.getComputedStyle) {
      this.mBackgroundColor = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('background-color');
    }
  }
  if (this.mBackgroundColor == '' || this.mBackgroundColor == 'transparent') {
    if (this.mBackgroundImage == '' || this.mBackgroundImage == 'none') {
      this._element.style.backgroundColor = 'white';
    }
  }
  if (document.all) {
    if (this._element.currentStyle) {
      this.mElementZIndex = this._element.currentStyle['zIndex'];
    } else if (window.getComputedStyle) {
      this.mElementZIndex = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('zIndex');
    }
  } else {
    if (this._element.currentStyle) {
      this.mElementZIndex = this._element.currentStyle['z-index'];
    } else if (window.getComputedStyle) {
      this.mElementZIndex = document.defaultView.getComputedStyle(this._element, null).getPropertyValue('z-index');
    }
  }
  this._highestOpacity = Math.max(pStartOpacity, pEndOpacity);
  this._lowestOpacity = Math.min(pStartOpacity, pEndOpacity);
  this._opacity = pStartOpacity;
  this.opacityInterval = (this._highestOpacity - this._lowestOpacity) / pSteps;
  this.mPI = Math.PI;
  this.mRadians = pDegrees * (this.mPI / 180);
  this.startX = this._element.offsetLeft;
  this.startY = this._element.offsetTop;
  this.xStep = Math.round(Math.sin(this.mRadians));
  this.yStep = Math.round(Math.cos(this.mRadians));
  this.pDistanceX = pDistance;
  this.pDistanceY = pDistance;
  if (pDegrees > 90 && pDegrees <= 180) { pDistanceY = -pDistanceY; }
  if (pDegrees > 180 && pDegrees <= 270) {
    pDistanceX = -pDistanceX;
    pDistanceY = -pDistanceY;
  }
  if (pDegrees > 270 && pDegrees <= 360) { this.pDistanceX = -this.pDistanceX; }
  this._shadowLeft = this.startX + this.pDistanceX;
  this._shadowTop = this.startY + this.pDistanceY;
  this._shadowCounter = 0;
  this._shadowIndex = this.mElementZIndex - (pSteps + 10);
  this._aryShadowList = new Array();
  for (var i=pDistance; i< (pDistance + pSteps); i++) {
    this.oShadowDiv = document.createElement('div');
    this.oShadowDiv.style.position = 'absolute';
    this.oShadowDiv.style.zIndex = this._shadowIndex + i;
    this._shadowLeft = this._shadowLeft + this.xStep;
    this._shadowTop = this._shadowTop + this.yStep;
    this.oShadowDiv.style.left = this._shadowLeft + 'px';
    this.oShadowDiv.style.top = this._shadowTop + 'px';
    this.oShadowDiv.style.width = this.mWidth + 'px';
    this.oShadowDiv.style.height = this.mHeight + 'px';
    this.oShadowDiv.style.backgroundColor = pColor;
    this.oShadowDiv.style.opacity = this._opacity / 100;
    this.oShadowDiv.style.filter = 'alpha(opacity=' + this._opacity + ')';
    this._element.parentNode.insertBefore(this.oShadowDiv, this._element);
    if (this._highestOpacity == pStartOpacity) {
      this._opacity = this._opacity - this.opacityInterval;
    } else {
      this._opacity = this._opacity + this.opacityInterval;
    }
    this._aryShadowList.push(this.oShadowDiv);
    this._shadowCounter = this._shadowCounter + 1;
  }
  this._shadowsHostElement = this._element.parentNode;
  this._numShadows = pSteps;
};

CDEShadow.prototype.removeShadows = function() {
  for (var i=0; i<this._numShadows; i++) {
    if (this._aryShadowList[i]) { this._shadowsHostElement.removeChild(this._aryShadowList[i]); }
  }
};

///////////////////////////
// END DROPSHADOW OBJECT //
///////////////////////////

// new deisgn
function replaceCenterContent(creativeObject, search, replace) {
  if (!replace) {
    replace = '';
  }

  creativeObject._centerSponsorTemplate = creativeObject._centerSponsorTemplate.replace(search, replace);
}

// new deisgn
function replaceCreativeContent(creativeObject, search, replace) {
  if (!replace) {
    replace = '';
  }
  creativeObject._creativeTemplate = creativeObject._creativeTemplate.replace(search, replace);
}

//////////////////////
// ASI Util Methods //
//////////////////////

//Return random key from an array.
function randomKey(obj) {
    var ret;
    var c = 0;
    for (var key in obj)
        if (Math.random() < 1/++c)
           ret = key;
    return ret;
}


/////////////////////////////////
// BEGIN CENTER SPONSOR OBJECT //
/////////////////////////////////
function creativeCenterSponsor(pElement, pCreativeObject) {
  this._element = pElement;
  if (!this._element.className) {
    this._element.className = 'centerSponsorContainer';
  }
  this._creativeObject = pCreativeObject;
  this._element.style.display = 'block';
  // replace {Recipe} with either _sponsorName OR ''
  if ( this._creativeObject._sponsorCourtesy != undefined) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{CourtesyPhrase}/g, this._creativeObject._sponsorCourtesy);
  }
  if (this._creativeObject._sponsorName) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Recipe}/g, this._creativeObject._sponsorName);
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Recipe}/g, '');
  }
  // replace {PrepTime}, {TotalTime} & {Difficulty} with
  // this._creativeObject._sponsorPrepTime, this._creativeObject._sponsorTotalTime & this._creativeObject._sponsorDifficulty OR ''
  if (this._creativeObject._sponsorPrepTime) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{PrepTime}/g, this._creativeObject._sponsorPrepTime);
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{PrepTime}/g, '');
  }
  if (this._creativeObject._sponsorTotalTime) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{TotalTime}/g, this._creativeObject._sponsorTotalTime);
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{TotalTime}/g, '');
  }
  if (this._creativeObject._sponsorDifficulty) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Difficulty}/g, this._creativeObject._sponsorDifficulty);
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Difficulty}/g, '');
  }
  // replace {Ingredients} with either this._creativeObject._sponsorIngredients OR ''
  if (this._creativeObject._sponsorIngredients) {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Ingredients}/g, this._creativeObject._sponsorIngredients);
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{Ingredients}/g, '');
  }
  // if impression tag provided, replace in template
  if (this._creativeObject._sponsor1x1) {
    var _cacheBuster = (new Date()).getTime();
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{centerSponsor1x1}/g, this._creativeObject._sponsor1x1.replace('$random$', _cacheBuster));
  } else {
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(/{centerSponsor1x1}/g, '');
  }

  // new design - display sponsor image if available
  sponsorImageSearch = /<if_sponsorImage>(.*)<\/if_sponsorImage>/;
  sponsorImageCheck = this._creativeObject._centerSponsorTemplate.match(sponsorImageSearch);
  if (sponsorImageCheck) {
    sponsorImageReplace = this._creativeObject._sponsorImage ? sponsorImageCheck[1] : '';
    this._creativeObject._centerSponsorTemplate = this._creativeObject._centerSponsorTemplate.replace(sponsorImageSearch, sponsorImageReplace);
  }

  // True count tag to help with discrepancies
  if( typeof(trueCount) != 'undefined' ){
    if( trueCount !== 'truCount' ){
      this._creativeObject._centerSponsorTemplate += '<img id="truCountTag" src="' + trueCount + '" width="1" height="1" style="display:none;" >';
    }
  }

  // new design - search and replace tags
  replaceCenterContent(this._creativeObject, /{featuredLinkHREF}/g, this._creativeObject._sponsorLinkID);
  replaceCenterContent(this._creativeObject, /{featuredLinkHREF2}/g, this._creativeObject._featuredLinkHREF2);
  replaceCenterContent(this._creativeObject, /{sponsorLinkID}/g, this._creativeObject._sponsorLinkID);
  replaceCenterContent(this._creativeObject, /{imagePath}/g, this._creativeObject._imagePath);
  replaceCenterContent(this._creativeObject, /{sponsorImage}/g, this._creativeObject._imagePath + this._creativeObject._sponsorImage);

  // console.log(this._creativeObject._centerSponsorTemplate);

  // after all replace() methods, lets set the info to this._element.innerHTML
  this._element.innerHTML = this._creativeObject._centerSponsorTemplate;




  // do a couple className checks to set some various info from [recipe].xml
  var _allElements = this._element.getElementsByTagName('*');
  for (var i=0; i<_allElements.length; i++) {
    if (_allElements[i].nodeType == 1) {
      for (var j=0; j<_allElements[i].attributes.length; j++) {
        if (_allElements[i].attributes.item(j).nodeName == 'class') {

          // new design
          if (_allElements[i].attributes.item(j).nodeValue.indexOf('meta') != -1) {
            stars = this._creativeObject._sponsorRating ? this._creativeObject._sponsorRating : '';
            _allElements[i].innerHTML = _allElements[i].innerHTML.replace(/\[#\]/g, stars);
          }

          if (_allElements[i].attributes.item(j).nodeValue == 'centerSponserRating') { _allElements[i].style.background = 'url(' + this._creativeObject._imagePath + this._creativeObject._sponsorRating + this._creativeObject._ratingImage.replace('[#]', '') + ') no-repeat center center'; }
          if (_allElements[i].attributes.item(j).nodeValue == 'centerSponsorImage') {
            if (this._creativeObject._sponsorImage) _allElements[i].style.background = 'url(' + this._creativeObject._imagePath + this._creativeObject._sponsorImage + ') no-repeat center center';
            if (_allElements[i].innerHTML == '[useFeatureHREF]') {
              var _axel = Math.random() + '';
              var _rand = _axel * 10000000000000;
              _allElements[i].innerHTML = '';
              _allElements[i].href = this._creativeObject._featuredLinkHREF.replace('{random}', _rand);
            }
            if (_allElements[i].innerHTML == '[useCenterSponsorHREF]') {
              var _axel = Math.random() + '';
              var _rand = _axel * 10000000000000;
              _allElements[i].innerHTML = '';
              _allElements[i].href = this._creativeObject._sponsorLinkID.replace('{random}', _rand);
            }
          }
          if (_allElements[i].attributes.item(j).nodeValue == 'ratingExtraImage') {
            if (!this._creativeObject._sponsorRatingExtraImage) { _allElements[i].style.display = 'none'; }
          }
          if (_allElements[i].attributes.item(j).nodeValue == 'centerSponsorRecipe') {
            _allElements[i]._this = this;
            if (this._creativeObject._sponsorLinkID) { _allElements[i].href = this._creativeObject._sponsorLinkID; }
            if (this._creativeObject._sponsorTrackingTag) { _allElements[i].onclick = function() { CreativeAd.prototype.trackThis(this._this._creativeObject._sponsorTrackingTag); } }
          }
        }
      }
    }
  }
  // try and append a seperator rule to the parents element before the center sponsors' next sibling
  if (!document.getElementById('fn-bd')) { // check if in new design
    this._parentSeperator = document.createElement('div');
    this._parentSeperator.className = 'seperator_rule';
    this._element.parentNode.insertBefore(this._parentSeperator, this._element.nextSibling);
  }
};

///////////////////////////////
// END CENTER SPONSOR OBJECT //
///////////////////////////////

///////////////////////////
// BEGIN CREATIVE OBJECT //
///////////////////////////

function CreativeAd(pCreateAdContainer, pCreativeObject) {
  // clog(pCreateAdContainer, pCreativeObject)
  if (pCreateAdContainer == null) {
    return;
  }
  this._element = pCreateAdContainer;
  this._element.style.display = 'block';
  this._creativeObject = pCreativeObject;
  this._flyoutTemplate = this._creativeObject._flyoutTemplate;
  // create the main Ad Area Container
  this._keywordRegExp = new RegExp('({Keyword})', 'g');
  this._creativeObject._creativeTemplate = this._creativeObject._creativeTemplate.replace(/\n/g, '');
  this._creativeObject._creativeTemplate = this._creativeObject._creativeTemplate.replace(/\t/g, '');
  this._creativeObject._creativeTemplate = this._creativeObject._creativeTemplate.replace(this._keywordRegExp, this.capitalizeWord($siKeyword));

  // new design
  replaceCreativeContent(this._creativeObject, /{featuredLinkHREF}/g, this._creativeObject._featuredLinkHREF);
  replaceCreativeContent(this._creativeObject, /{featuredLinkHREF2}/g, this._creativeObject._featuredLinkHREF2);
  replaceCreativeContent(this._creativeObject, /{sponsorLinkID}/g, this._creativeObject._sponsorLinkID);
  replaceCreativeContent(this._creativeObject, /{imagePath}/g, this._creativeObject._imagePath);
  replaceCreativeContent(this._creativeObject, /{sponsorImage}/g, this._creativeObject._imagePath + this._creativeObject._sponsorImage);


  this._adsRepeatSearchPhrase = /<ads_repeat>(.*)<\/ads_repeat>/;
  this._adsRepeatArea = this._creativeObject._creativeTemplate.match(this._adsRepeatSearchPhrase);
  this._creativeObject._creativeTemplate = this._creativeObject._creativeTemplate.replace(this._adsRepeatSearchPhrase, '');
  this._element.innerHTML = this._creativeObject._creativeTemplate;

  // create 1x1 tracking
  if ( document.getElementById('viewTracker') ) {
    if ( this._creativeObject._1x1Tracker ) {
      this._axel = Math.random() + '';
      this._rand = this._axel * 10000000000000;
      document.getElementById('viewTracker').src = this._creativeObject._1x1Tracker.replace('$random$', this._rand);
    }
  }
  if ( document.getElementById('sniViewTracker') ) {
    if ( this._creativeObject._sni1x1Tracker ) {
      this._axel = Math.random() + '';
      this._rand = this._axel * 10000000000000;
      document.getElementById('sniViewTracker').src = this._creativeObject._sni1x1Tracker.replace('$random$', this._rand);
    }
  }

  // BEGIN FEATURED //
  if ( document.getElementById('featuredAdContainer') ) {
    var _allElements = document.getElementById('featuredAdContainer').getElementsByTagName('*');
    for ( var i=0; i<_allElements.length; i++ ) {
      if ( _allElements[i].nodeType == 1 ) {
        for ( var j=0; j<_allElements[i].attributes.length; j++ ) {
          if ( _allElements[i].attributes.item(j).nodeName == 'class' ) {
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('featureImage') != -1 ) {
              _allElements[i]._this = this;
              if ( this._creativeObject._featuredImageSrc ) {
                _allElements[i].style.background = 'url(' + this._creativeObject._featuredImageSrc + ') no-repeat center center';
              }
              if ( this._creativeObject._featuredTrackingTag && this._creativeObject._featuredLinkHREF ) {
                // check to see if featuredImage is an anchor or another type of element
                // if it's not an anchor, set the onclick to track and popup to new window
                if ( _allElements[i].nodeName.toLowerCase() != 'a' ) {
                  _allElements[i].onclick = function() {
                    if ( this._this._creativeObject._featuredTrackingTag ) {
                      this._this.trackThis(this._this._creativeObject._featuredTrackingTag);
                    }
                    if ( this._this._creativeObject._featuredLinkHREF ) {
                      this._this.popWin(this._this._creativeObject._featuredLinkHREF);
                    }
                  }
                } else {
                  // if it is an anchor, set the onclick to track but the HREF to (whatever)
                  _allElements[i].onclick = function() {
                    if ( this._this._creativeObject._featuredTrackingTag ) {
                      this._this.trackThis(this._this._creativeObject._featuredTrackingTag);
                    }
                  }
                  if ( this._creativeObject._featuredLinkHREF ) {
                    _allElements[i].href = this._creativeObject._featuredLinkHREF;
                  }
                }
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('featureLogo') != -1 ) {
              if ( _allElements[i].innerHTML == '[useFeatureHREF2]' ) {
                var _axel = Math.random() + '';
                var _rand = _axel * 10000000000000;
                _allElements[i].innerHTML = '';
                _allElements[i].href = this._creativeObject._featuredLinkHREF2.replace('{random}', _rand);
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('videoImage') != -1 ) {
              if ( !eval(this._creativeObject._videoAvailable) ) {
                _allElements[i].style.display = 'none';
                for ( var k=0; k<_allElements.length; k++ ) {
                  if ( _allElements[k].innerHTML.indexOf('recipe video available') != -1 ) {
                    _allElements[k].style.display = 'none';
                  }
                }
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('featureRecipe') != -1 ) {
              if ( this._creativeObject._featuredName ) {
                _allElements[i].innerHTML = this._creativeObject._featuredName.replace(/{RegTM}/g, '&reg;');
              } else {
                _allElements[i].innerHTML = '';
              }
              if ( this._creativeObject._featuredLinkHREF ) {
                _allElements[i].href = this._creativeObject._featuredLinkHREF;
              }
              _allElements[i]._this = this;
              if ( this._creativeObject._featuredImageSrc ) {
                _allElements[i].onclick = function() {
                  this._this.trackThis(this._this._creativeObject._featuredTrackingTag);
                }
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('ratings') != -1 ) {
              if ( this._creativeObject._ratingImage ) {
                _allElements[i].style.background = 'url(' + this._creativeObject._imagePath + this._creativeObject._featuredRating + this._creativeObject._ratingImage.replace('[#]', '') + ') no-repeat center center';
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('healthyImage') != -1 ) {
              if ( !eval(this._creativeObject._featuredHealthyLiving) ) {
                _allElements[i].style.display = 'none';
              }
            }
            if ( _allElements[i].attributes.item(j).nodeValue.indexOf('featureInfo') != -1 ) {
              if ( this._creativeObject._featuredPrepTime ) {
                _allElements[i].innerHTML = _allElements[i].innerHTML.replace(/{PrepTime}/g, this._creativeObject._featuredPrepTime);
              }
              if ( this._creativeObject._featuredTotalTime ) {
                _allElements[i].innerHTML = _allElements[i].innerHTML.replace(/{TotalTime}/g, this._creativeObject._featuredTotalTime);
              }
              if ( this._creativeObject._featuredDifficulty ) {
                _allElements[i].innerHTML = _allElements[i].innerHTML.replace(/{Difficulty}/g, this._creativeObject._featuredDifficulty);
              }
            }
          }
        }
      }
    }
  }
  // END FEATURED //

  // BEGIN RECIPE LIST //
  if ( document.getElementById('recipeListContainer') ) {
    this._recipeListContainer = document.getElementById('recipeListContainer');

    var length = this._creativeObject._recipes.length;//cache array length
    for ( var i=0; i<length; i++ ) {
      this._temp = this._adsRepeatArea[1];

      this._href = '';
      this._innerHTML = '';
      this._adLinkID = this._creativeObject._recipes[i]._adLinkID;
      this._adName = this._creativeObject._recipes[i]._adName.replace(/{RegTM}/g, '&reg;');
      this._adPrepTime = this._creativeObject._recipes[i]._adPrepTime;
      this._adTotalTime = this._creativeObject._recipes[i]._adTotalTime;
      this._adDifficulty = this._creativeObject._recipes[i]._adDifficulty;
      this._adImage = this._creativeObject._imagePath + this._creativeObject._recipes[i]._adImage;

      //New ASI Module Values
      this._adVar1 = this._creativeObject._recipes[i]._adVar1;
      this._adVar1Link = this._creativeObject._recipes[i]._adVar1Link;
      this._adVar1LinkNewWindow = this._creativeObject._recipes[i]._adVar1LinkNewWindow;
      this._adVar2 = this._creativeObject._recipes[i]._adVar2;
      this._adVar2Link = this._creativeObject._recipes[i]._adVar2Link;
      this._adVar2LinkNewWindow = this._creativeObject._recipes[i]._adVar2LinkNewWindow;
      //End of New ASI Module Values

      if ( this._adName ) {
        this._innerHTML = this._adName;
      }
      var _axel2 = Math.random() + '';
      var _rand2 = _axel2 * 10000000000000;
      if ( this._adLinkID ) {
        this._href = this._adLinkID.replace('{random}', _rand2);
      }
      this._temp = this._temp.replace('{Recipe}', this._innerHTML);
      this._temp = this._temp.replace('href=""', 'href="' + this._href + '"');
      if ( this._adPrepTime ) {
        this._temp = this._temp.replace('{PrepTime}', this._adPrepTime);
      }
      if ( this._adTotalTime ) {
        this._temp = this._temp.replace('{TotalTime}', this._adTotalTime);
      }
      if ( this._adDifficulty ) {
        this._temp = this._temp.replace('{Difficulty}', this._adDifficulty);
      }
      // New ASI Module Additions
      if ( this._adImage ) {
        this._temp = this._temp.replace('{image}', this._adImage);
      }
      if ( this._adName ) {
        this._temp = this._temp.replace('{name}', this._adName);
      }
      if ( this._adName ) {
        this._temp = this._temp.replace('{altName}', this._adName);
      }
      //set var1 item. If no link, plain text. If link, but no text blank string
      if ( (this._adVar1Link) && (this._adVar1) ) {
        if ( this._adVar1LinkNewWindow == 1){
          this._temp = this._temp.replace('{var1}', '<a href="' + this._adVar1Link + '" target="_blank">' + this._adVar1 + '</a>');
        } else {
          this._temp = this._temp.replace('{var1}', '<a href="' + this._adVar1Link + '">' + this._adVar1 + '</a>');
        }
      } else if ( this._adVar1 ) {
        this._temp = this._temp.replace('{var1}', this._adVar1);
      } else {
        this._temp = this._temp.replace('{var1}', '');
      }
      //set var2 item. If no link, plain text. If link, but no text blank string
      if ( this._adVar2Link && (this._adVar2) ) {
        if ( this._adVar2LinkNewWindow == 1 ){
          this._temp = this._temp.replace('{var2}', '<a href="' +  this._adVar2Link + '" target="_blank">' + this._adVar2 + '</a>');
        } else {
          this._temp = this._temp.replace('{var2}', '<a href="' + this._adVar2Link + '">' + this._adVar2 + '</a>');
        }
      } else if ( this._adVar2 ) {
        this._temp = this._temp.replace('{var2}', this._adVar2);
      } else {
        this._temp = this._temp.replace('<li>{var2}</li>', '');
      }
      if ( this._adLinkID ) {
        this._temp = this._temp.replace('{adLinkID}', this._adLinkID);
        this._temp = this._temp.replace('{adImageLinkID}', this._adLinkID);
      }
      //update dom element

      this._recipeListContainer.innerHTML += this._temp;
    }

    var elapsedTime = (new Date()).getTime() - rsi_timeStart;
    if(CDEHttp.DEBUG) console.log("Processing complete: +" +  elapsedTime + ' ms');

  }
  // END RECIPE LIST //
};

CreativeAd.prototype.capitalizeWord = function(pString) {
  return pString.substring(0, 1).toUpperCase() + pString.substring(1, pString.length) + ' ';
};

CreativeAd.prototype.destroyFlyout = function(pElement) {
  if ( eval(this._creativeObject._usingShadow) ) {
    try {
      mShadows.removeShadows();
    } catch(e) { }
  }
  try {
    this._creativeObject._creativeContainer.removeChild(this._flyoutContainer);
  } catch(e) { }
};

CreativeAd.prototype.createFlyout = function(pElement) {
  // create the flyout container
  this._flyoutContainer = document.createElement('div');
  this._flyoutContainer.id = 'flyoutContainer';
  this._flyoutContainer.style.zIndex = this.getHighestZIndex();
  this._flyoutContainer.innerHTML = this._flyoutTemplate;
  this._creativeObject._creativeContainer.appendChild(this._flyoutContainer);
  // create the flyout image
  if ( document.getElementById('flyoutImage') ) {
    document.getElementById('flyoutImage').src = this._creativeObject._imagePath + pElement._adImage;
  }
  // set the position
  this._flyoutYPosition = -(this._flyoutContainer.offsetHeight) - 5;

  if (document.getElementById('fn_rsr_container')) {
    this._fn_rsr_containerY = this.findPos(document.getElementById('fn_rsr_container'))[1];
  } else {
    this._fn_rsr_containerY = 0;
  }

  this._flyoutYPosition = this._flyoutYPosition - this._fn_rsr_containerY;
  this.setLyr(pElement, this._flyoutContainer, 100, this._flyoutYPosition);
  // create a shadow if wanted
  if ( eval(this._creativeObject._usingShadow) ) {
    mShadows = new CDEShadow('flyoutContainer', this._creativeObject._shadowColor, this._creativeObject._shadowDistance, this._creativeObject._shadowAngle, this._creativeObject._shadowThickness, this._creativeObject._shadowStartOpacity, this._creativeObject._shadowEndOpacity);
  }
};

CreativeAd.prototype.findPos = function(obj) {
  this._curleft = this._curtop = 0;
  if ( obj.offsetParent ) {
    this._curleft = obj.offsetLeft;
    this._curtop = obj.offsetTop;
    while ( obj = obj.offsetParent ) {
      this._curleft += obj.offsetLeft;
      this._curtop += obj.offsetTop;
    }
  }
  return [this._curleft, this._curtop];
};

CreativeAd.prototype.setLyr = function(obj, lyr, offX, offY) {
  this._coors = this.findPos(obj);
  var x = lyr;
  x.style.top = this._coors[1] + offY + 'px';
  x.style.left = this._coors[0] + offX + 'px';
};

CreativeAd.prototype.getHighestZIndex = function() {
  this._allElements = document.getElementsByTagName('*');
  this._zIndices = new Array();
  this._zIndices[0] = 0;
  for ( var i=0; i<this._allElements.length; i++ ) {
    if ( this._allElements[i].nodeType == 1 ) {
      if ( document.all ) {
        if ( this._allElements[i].currentStyle ) {
          this._zIndex = this._allElements[i].currentStyle['zIndex'];
          if ( !isNaN(this._zIndex) ) {
            this._zIndices.push(this._zIndex);
          }
        } else if (window.getComputedStyle) {
          this._zIndex = document.defaultView.getComputedStyle(this._allElements[i], null).getPropertyValue('zIndex');
          if ( !isNaN(this._zIndex) ) {
            this._zIndices.push(this._zIndex);
          }
        }
      } else {
        if ( this._allElements[i].currentStyle ) {
          this._zIndex = this._allElements[i].currentStyle['z-index'];
          if ( !isNaN(this._zIndex) ) {
            this._zIndices.push(this._zIndex);
          }
        } else if (window.getComputedStyle) {
          this._zIndex = document.defaultView.getComputedStyle(this._allElements[i], null).getPropertyValue('z-index');
          if ( !isNaN(this._zIndex) ) {
            this._zIndices.push(this._zIndex);
          }
        }
      }
    }
  }
  this._zIndices = this._zIndices.sort(this.sortZindex);
  return parseInt(this._zIndices[this._zIndices.length - 1]);
};

CreativeAd.prototype.sortZindex = function(a, b) {
  return a - b;
};

CreativeAd.prototype.trackThis = function(pTrackingString) {
  document.getElementById('adTracking').src = pTrackingString;
};

CreativeAd.prototype.popWin = function(pURL) {
  this._popWin = window.open(pURL, 'popWin', 'width=800, height=600, resizable=1, scrollbars=1, status=1, toolbar=1, location=1, menubar=1');
  this._popWin.moveTo(0, 0);
};

///////////////////////////
// BEGIN CREATIVE OBJECT //
///////////////////////////
function Creative(pCreativeContainerID, pCenterSponsorContainerID, pBigBoxContainerID) {
  _self = this;
  this._creativeContainer = document.getElementById(pCreativeContainerID);
  this._centerSponsorContainer = document.getElementById(pCenterSponsorContainerID);

  if( CDEHttp.DEBUG ) console.log("RSI Process started at: " + (new Date()).toTimeString());
  rsi_timeStart = (new Date()).getTime();

  // Load XML assets

  var elapsedTime = (new Date()).getTime() - rsi_timeStart;
  if( CDEHttp.DEBUG ) console.log("Template XML Requested: +" +  elapsedTime + ' ms');
  CDEHttp.getXML($siTemplateXML, function(pResponseXML) {
    _self.templateLoaded(pResponseXML, function(pResponseXML) {
      var elapsedTime = (new Date()).getTime() - rsi_timeStart;
      if( CDEHttp.DEBUG ) console.log("Template XML Loaded: +" +  elapsedTime + ' ms');

      var elapsedTime = (new Date()).getTime() - rsi_timeStart;
      if( CDEHttp.DEBUG ) console.log("Keyword XML Requested: +" +  elapsedTime + ' ms');

      //  Load 2nd XML in callback of first. Then start module. SHould fix module periodic module load failure.
      CDEHttp.getXML(_sponsorXML, _self.recipesLoaded);
    });
  });

};

Creative.prototype.templateLoaded = function(pResponseXML, callback) {
  // generic info
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'sponsorCSS', '', 'href') != undefined ) {
    _self._sponsorCSS = CDEHttp.getNodeAttributeValue(pResponseXML, 'sponsorCSS', '', 'href');
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'imagePath', 0) != undefined ) {
    _self._imagePath = CDEHttp.getNodeValue(pResponseXML, 'imagePath', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'ratingImage', 0) != undefined ) {
    _self._ratingImage = CDEHttp.getNodeValue(pResponseXML, 'ratingImage', 0);
  }
  // templates
  if ( CDEHttp.getNodeValue(pResponseXML, 'creative_template', 0) != undefined ) {
    _self._creativeTemplate = CDEHttp.getNodeValue(pResponseXML, 'creative_template', 0);
    // clog('pResponseXML: ', CDEHttp.getNodeValue(pResponseXML, 'creative_template', 0), _self._creativeTemplate, typeof CDEHttp.getNodeValue(pResponseXML, 'creative_template', 0))
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'flyout_template', 0) != undefined ) {
    _self._flyoutTemplate = CDEHttp.getNodeValue(pResponseXML, 'flyout_template', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'center_sponsor_template', 0) != undefined ) {
    _self._centerSponsorTemplate = CDEHttp.getNodeValue(pResponseXML, 'center_sponsor_template', 0);
  }
  // shadow configs
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'using') != undefined ) {
    _self._usingShadow = CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'using');
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'color') != undefined ) {
    _self._shadowColor = CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'color');
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'distance') != undefined ) {
    _self._shadowDistance = parseInt(CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'distance'));
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'angle') != undefined ) {
    _self._shadowAngle = parseInt(CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'angle'));
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'thickness') != undefined ) {
    _self._shadowThickness = parseInt(CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'thickness'));
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'startOpacity') != undefined ) {
    _self._shadowStartOpacity = parseInt(CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'startOpacity'));
  }
  if ( CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'endOpacity') != undefined ) {
    _self._shadowEndOpacity = parseInt(CDEHttp.getNodeAttributeValue(pResponseXML, 'shadow', '', 'endOpacity'));
  }
  _self.sponsorCSS = document.getElementsByTagName('head')[0].appendChild(document.createElement('link'));
  _self.sponsorCSS.id = 'overrideCSS';
  _self.sponsorCSS.rel = 'stylesheet';
  _self.sponsorCSS.href = _self._sponsorCSS;
  _self.sponsorCSS.type = 'text/css';

  if ( callback ) {
    callback.call(_self, pResponseXML);
  }
};


Creative.prototype.recipesLoaded = function(pResponseXML) {
  var elapsedTime = (new Date()).getTime() - rsi_timeStart;
  if( CDEHttp.DEBUG ) console.log("Keyword XML loaded: +" +  elapsedTime + ' ms');

  if( CDEHttp.DEBUG ) console.log("Module processing started...");

  // generic info
  if ( CDEHttp.getNodeValue(pResponseXML, 'baseURL', 0) != undefined ) {
    _self._linkPath = CDEHttp.getNodeValue(pResponseXML, 'baseURL', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'videoAvailable', 0) != undefined ) {
    _self._videoAvailable = CDEHttp.getNodeValue(pResponseXML, 'videoAvailable', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'viewTracker', 0) != undefined ) {
    _self._1x1Tracker = CDEHttp.getNodeValue(pResponseXML, 'viewTracker', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sniViewTracker', 0) != undefined ) {
    _self._sni1x1Tracker = CDEHttp.getNodeValue(pResponseXML, 'sniViewTracker', 0);
  }

  // get featured ad info
  if ( CDEHttp.getNodeValue(pResponseXML, 'image', 0) != undefined ) {
    _self._featuredImageSrc = _self._imagePath + CDEHttp.getNodeValue(pResponseXML, 'image', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'name', 0) != undefined ) {
    _self._featuredName = CDEHttp.getNodeValue(pResponseXML, 'name', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', 0) != undefined ) {
    _self._featuredHealthyLiving = CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'linkId', 0) != undefined ) {
    _self._featuredLinkHREF = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'linkId', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'linkId2', 0) != undefined ) {
    _self._featuredLinkHREF2 = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'linkId2', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'prepTime', 0) != undefined ) {
    _self._featuredPrepTime = CDEHttp.getNodeValue(pResponseXML, 'prepTime', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'totalTime', 0) != undefined ) {
    _self._featuredTotalTime = CDEHttp.getNodeValue(pResponseXML, 'totalTime', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'difficulty', 0) != undefined ) {
    _self._featuredDifficulty = CDEHttp.getNodeValue(pResponseXML, 'difficulty', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'rating', 0) != undefined ) {
    _self._featuredRating = CDEHttp.getNodeValue(pResponseXML, 'rating', 0);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'trackingTag', 0) != undefined ) {
    _self._featuredTrackingTag = CDEHttp.getNodeValue(pResponseXML, 'trackingTag', 0);
  }
  // get recipe info
  if ( CDEHttp.getNodesLength(pResponseXML, 'recipe') != undefined ) {
    _self._recipeAdsLength = CDEHttp.getNodesLength(pResponseXML, 'recipe');
  }

  //if max recipe set, use this as max display count
  if ( CDEHttp.getNodeValue(pResponseXML, 'maxRecipeDisplay', 0) != undefined ) {
   _self._recipesDisplayCount = CDEHttp.getNodeValue(pResponseXML, 'maxRecipeDisplay', 0);
   _self._recipesDisplayCount = (_self._recipesDisplayCount > _self.defaultMaxRecipeDisplay) ? _self.defaultMaxRecipeDisplay : _self._recipesDisplayCount;

    // If not on MB preview override the XML setting to avoid trafficking of higher limit XMLs from QA
    if( window.location.hostname !== "scrippsonline.com" ) {
      _self._recipesDisplayCount = _self.defaultMaxRecipeDisplay;
    }
  }

  //create array of recipes to display based on keywords
  var _array = new Array();
  _self._recipes = _array;
  // create array to hold non matching recipes.
  _self._recipesNoMatch = new Array();
  _self._recipesLength = _self._recipeAdsLength;//cache length for better performance
  for ( var i=0; i<_self._recipesLength; i++ ) {
    //Determine if the current recipe matches page keyword
    var asi_recipeKeywords = pResponseXML.getElementsByTagName("keywords")[i];
    var asi_recMatch = false;
    var asi_keyword_keyword = asi_recipeKeywords.getElementsByTagName("keyword");
    var asi_keyword_length = asi_keyword_keyword.length;
    ///loop through keywords looking for a match. If matched set to true.
    for ( var x = 0; x < asi_keyword_length; x++ ){
      if( asi_keyword_keyword[x].firstChild.nodeValue.toLowerCase() == $siKeyword ){
        asi_recMatch = true;
      }
    }

    //if keywords dont match. Kill the recipe from the list
    if (asi_recMatch == true){
      var tempRecipe = new Object(); //build up a temp recipe
      if ( CDEHttp.getNodeValue(pResponseXML, 'name', i + 1) != undefined ) {
        tempRecipe._adName = CDEHttp.getNodeValue(pResponseXML, 'name', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'image', i + 1) != undefined ) {
        tempRecipe._adImage = CDEHttp.getNodeValue(pResponseXML, 'image', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', i + 1) != undefined ) {
        tempRecipe._adHealthyLiving = CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'rating', i + 1) != undefined ) {
        tempRecipe._adRating = CDEHttp.getNodeValue(pResponseXML, 'rating', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'linkId', i + 1) != undefined ) {
        var _cacheBuster = (new Date()).getTime();
        tempRecipe._adLinkID = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'linkId', i + 1).replace('$random$', _cacheBuster);
      }

      // NEW ASI Module Variable Value Nodes
      // for some reason these need the true i. Not "i+1"
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1', i) != undefined ) {
        tempRecipe._adVar1 = CDEHttp.getNodeValue(pResponseXML, 'var1', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1Link', i) != undefined ) {
        var _cacheBuster = (new Date()).getTime();
        tempRecipe._adVar1Link = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'var1Link', i).replace('$random$', _cacheBuster);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1LinkNewWindow', i) != undefined ) {
        tempRecipe._adVar1LinkNewWindow = parseInt(CDEHttp.getNodeValue(pResponseXML, 'var1LinkNewWindow', i), 10);
      } else {
        tempRecipe._adVar1LinkNewWindow = 0; //default to 0. Open in parent.
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2', i) != undefined ) {
        tempRecipe._adVar2 = CDEHttp.getNodeValue(pResponseXML, 'var2', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2Link', i) != undefined ) {
        var _cacheBuster = (new Date()).getTime();
        tempRecipe._adVar2Link = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'var2Link', i).replace('$random$', _cacheBuster);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2LinkNewWindow', i) != undefined ) {
        tempRecipe._adVar2LinkNewWindow = parseInt(CDEHttp.getNodeValue(pResponseXML, 'var2LinkNewWindow', i), 10);
      } else {
        tempRecipe._adVar2LinkNewWindow = 0; //default to 0. Open in parent.
      }
      // END OF NEW NODES

      if ( CDEHttp.getNodeValue(pResponseXML, 'difficulty', i + 1) != undefined ) {
        tempRecipe._adDifficulty = CDEHttp.getNodeValue(pResponseXML, 'difficulty', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'prepTime', i + 1) != undefined ) {
        tempRecipe._adPrepTime = CDEHttp.getNodeValue(pResponseXML, 'prepTime', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'totalTime', i + 1) != undefined ) {
        tempRecipe._adTotalTime = CDEHttp.getNodeValue(pResponseXML, 'totalTime', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'trackingTag', i + 1) != undefined ) {
        tempRecipe._adTrackingTag = CDEHttp.getNodeValue(pResponseXML, 'trackingTag', i + 1);
      }
      //push matching recipe onto recipe stack
      _self._recipes.push(tempRecipe);
    } else {
      //  Build array item for non keyword-matching recipes
      var tempRecipe = new Object(); //build up a temp recipe
      if ( CDEHttp.getNodeValue(pResponseXML, 'name', i + 1) != undefined ) {
        tempRecipe._adName = CDEHttp.getNodeValue(pResponseXML, 'name', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'image', i + 1) != undefined ) {
        tempRecipe._adImage = CDEHttp.getNodeValue(pResponseXML, 'image', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', i + 1) != undefined ) {
        tempRecipe._adHealthyLiving = CDEHttp.getNodeValue(pResponseXML, 'healthyLiving', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'rating', i + 1) != undefined ) {
        tempRecipe._adRating = CDEHttp.getNodeValue(pResponseXML, 'rating', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'linkId', i + 1) != undefined ) {
        tempRecipe._adLinkID = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'linkId', i + 1);
      }

      // NEW ASI Module Variable Value Nodes
      //or some reason these need the true i. Not "i+1"
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1', i) != undefined ) {
        tempRecipe._adVar1 = CDEHttp.getNodeValue(pResponseXML, 'var1', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1Link', i) != undefined ) {
        tempRecipe._adVar1Link = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'var1Link', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var1LinkNewWindow', i) != undefined ) {

        tempRecipe._adVar1LinkNewWindow = parseInt(CDEHttp.getNodeValue(pResponseXML, 'var1LinkNewWindow', i), 10);
      } else {
        tempRecipe._adVar1LinkNewWindow = 0; //default to 0. Open in parent.
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2', i) != undefined ) {
        tempRecipe._adVar2 = CDEHttp.getNodeValue(pResponseXML, 'var2', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2Link', i) != undefined ) {
        tempRecipe._adVar2Link = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'var2Link', i);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'var2LinkNewWindow', i) != undefined ) {
        tempRecipe._adVar2LinkNewWindow = parseInt(CDEHttp.getNodeValue(pResponseXML, 'var2LinkNewWindow', i), 10);
      } else {
        tempRecipe._adVar2LinkNewWindow = 0; //default to 0. Open in parent.
      }
      // END OF NEW NODES

      if ( CDEHttp.getNodeValue(pResponseXML, 'difficulty', i + 1) != undefined ) {
        tempRecipe._adDifficulty = CDEHttp.getNodeValue(pResponseXML, 'difficulty', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'prepTime', i + 1) != undefined ) {
        tempRecipe._adPrepTime = CDEHttp.getNodeValue(pResponseXML, 'prepTime', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'totalTime', i + 1) != undefined ) {
        tempRecipe._adTotalTime = CDEHttp.getNodeValue(pResponseXML, 'totalTime', i + 1);
      }
      if ( CDEHttp.getNodeValue(pResponseXML, 'trackingTag', i + 1) != undefined ) {
        tempRecipe._adTrackingTag = CDEHttp.getNodeValue(pResponseXML, 'trackingTag', i + 1);
      }
      //push recipe onto nonmatching recipe stack
      _self._recipesNoMatch.push(tempRecipe);
    }
  }


  //Set to max if declared. Else default to 4
  var maxDisplay = (_self._recipesDisplayCount) ? _self._recipesDisplayCount : 4;
    if ( _self._recipes.length >= maxDisplay ) {
      //randomize
      var v = _self._recipes;
      var length = v.length;
      for(var j, x, i =  length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
      //remove remaining elements
      v = v.splice(0, maxDisplay)
      _self._recipes = v;
    } else {
      // Less recipes than max display. Grab amount needed from unmatched recipes array
      var recipeDeficit = maxDisplay - _self._recipes.length;
      var keys = [];
      var q = 0;

      while( q < recipeDeficit ){
        var keyCandidate = randomKey(_self._recipesNoMatch); // Grab random key from recipe
        if( keys.join().indexOf(keyCandidate) < 0 ){
          keys.push(keyCandidate);
          q++;
        }
      }
      // Now we have an array of random keys for the nonmatching recipe array
      var keysLength = keys.length;
      if( keysLength > 0 ) {
        for( var q = 0; q < keysLength; q++ ){
          // Add recipe item for key to recipe list
          _self._recipes.push(_self._recipesNoMatch[keys[q]]);
        }
      }
    }


  //Determine which center recipe to show. Get the index
  var asi_centerRecipes = pResponseXML.getElementsByTagName("center_recipe");
  var asi_matchingCenterIndexes = new Array();
  var asi_centerRecipeIndex, asi_centerRecipeKeywords;
  //loop through center recipes and get one with the keyword

  // Determine random recipe for center result if multiple center recipe keywords are repeated.
  for ( var x = 0; x < asi_centerRecipes.length; x++ ){
    asi_sponsorKeywords = asi_centerRecipes[x].getElementsByTagName("keyword");
    for ( var y = 0; y < asi_sponsorKeywords.length; y++ ){
      if( asi_sponsorKeywords[y].firstChild.nodeValue.toLowerCase() == $siKeyword ){
        //keyword Match - Set index
        asi_matchingCenterIndexes.push(x); // Add matching index to list
      }
    }
  }

  // Set the asi_centerRecipeIndex to a random value of array.
  asi_centerRecipeIndex = asi_matchingCenterIndexes[Math.floor(Math.random()*asi_matchingCenterIndexes.length)]

  // if(CDEHttp.DEBUG) console.log(asi_centerRecipeIndex);

  // get center sponsor info using center index
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_name', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorName = CDEHttp.getNodeValue(pResponseXML, 'sponsor_name', asi_centerRecipeIndex);
    // if(CDEHttp.DEBUG) console.log(_self._sponsorName);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_linkId', asi_centerRecipeIndex) != undefined ) {
    var _cacheBuster = (new Date()).getTime();
    _self._sponsorLinkID = _self._linkPath + CDEHttp.getNodeValue(pResponseXML, 'sponsor_linkId', asi_centerRecipeIndex).replace('$random$', _cacheBuster);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_difficulty', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorDifficulty = CDEHttp.getNodeValue(pResponseXML, 'sponsor_difficulty', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_prepTime', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorPrepTime = CDEHttp.getNodeValue(pResponseXML, 'sponsor_prepTime', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_ingredients', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorIngredients = CDEHttp.getNodeValue(pResponseXML, 'sponsor_ingredients', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_totalTime', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorTotalTime = CDEHttp.getNodeValue(pResponseXML, 'sponsor_totalTime', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_image', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorImage = CDEHttp.getNodeValue(pResponseXML, 'sponsor_image', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_healthyLiving', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorHealthyLiving = CDEHttp.getNodeValue(pResponseXML, 'sponsor_healthyLiving', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_rating', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorRating = CDEHttp.getNodeValue(pResponseXML, 'sponsor_rating', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_1x1', asi_centerRecipeIndex) != undefined ) {
    var _cacheBuster = (new Date()).getTime();
    _self._sponsor1x1 = CDEHttp.getNodeValue(pResponseXML, 'sponsor_1x1', asi_centerRecipeIndex).replace('$random$', _cacheBuster);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_servings', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorServings = CDEHttp.getNodeValue(pResponseXML, 'sponsor_servings', asi_centerRecipeIndex);
  }
  if ( CDEHttp.getNodeValue(pResponseXML, 'sponsor_courtesy', asi_centerRecipeIndex) != undefined ) {
    _self._sponsorCourtesy = CDEHttp.getNodeValue(pResponseXML, 'sponsor_courtesy', asi_centerRecipeIndex);
  }
  // display the creative
  // clog('1', _self._creativeContainer, _self._creativeTemplate);
  if ( _self._creativeTemplate ) {
    // clog('2', _self._creativeContainer, _self, CreativeAd);
    new CreativeAd(_self._creativeContainer, _self);
  }
  // if using center sponsor and it matches current keyword then display it
  if ( _self._centerSponsorTemplate && asi_centerRecipeIndex != undefined ) {
    if ( _self._centerSponsorContainer ) {
      new creativeCenterSponsor(_self._centerSponsorContainer, _self);
    }
  }
};
/////////////////////////
// END CREATIVE OBJECT //
/////////////////////////

// Lets get started
new Creative('sponsorRR1', 'sponsorCtr2', 'ad_fn_rsr');