Slick.prototype.swipeDirection = function () {
  var xDist,
    yDist,
    r,
    swipeAngle,
    _ = this;

  xDist = _.touchObject.startX - _.touchObject.curX;
  yDist = _.touchObject.startY - _.touchObject.curY;
  r = Math.atan2(yDist, xDist);

  swipeAngle = Math.round((r * 180) / Math.PI);
  if (swipeAngle < 0) {
    swipeAngle = 360 - Math.abs(swipeAngle);
  }

  if (swipeAngle <= 45 && swipeAngle >= 0) {
    return _.options.rtl === false ? "left" : "right";
  }
  if (swipeAngle <= 360 && swipeAngle >= 315) {
    return _.options.rtl === false ? "left" : "right";
  }
  if (swipeAngle >= 135 && swipeAngle <= 225) {
    return _.options.rtl === false ? "right" : "left";
  }
  if (_.options.verticalSwiping === true) {
    if (swipeAngle >= 35 && swipeAngle <= 135) {
      return "down";
    } else {
      return "up";
    }
  }

  return "vertical";
};

Slick.prototype.swipeEnd = function (event) {
  var _ = this,
    slideCount,
    direction;

  _.dragging = false;
  _.swiping = false;

  if (_.scrolling) {
    _.scrolling = false;
    return false;
  }

  _.interrupted = false;
  _.shouldClick = _.touchObject.swipeLength > 10 ? false : true;

  if (_.touchObject.curX === undefined) {
    return false;
  }

  if (_.touchObject.edgeHit === true) {
    _.$slider.trigger("edge", [_, _.swipeDirection()]);
  }

  if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {
    direction = _.swipeDirection();

    switch (direction) {
      case "left":
      case "down":
        slideCount = _.options.swipeToSlide
          ? _.checkNavigable(_.currentSlide + _.getSlideCount())
          : _.currentSlide + _.getSlideCount();

        _.currentDirection = 0;

        break;

      case "right":
      case "up":
        slideCount = _.options.swipeToSlide
          ? _.checkNavigable(_.currentSlide - _.getSlideCount())
          : _.currentSlide - _.getSlideCount();

        _.currentDirection = 1;

        break;

      default:
    }

    if (direction != "vertical") {
      _.slideHandler(slideCount);
      _.touchObject = {};
      _.$slider.trigger("swipe", [_, direction]);
    }
  } else {
    if (_.touchObject.startX !== _.touchObject.curX) {
      _.slideHandler(_.currentSlide);
      _.touchObject = {};
    }
  }
};

Slick.prototype.swipeHandler = function (event) {
  var _ = this;

  if (
    _.options.swipe === false ||
    ("ontouchend" in document && _.options.swipe === false)
  ) {
    return;
  } else if (
    _.options.draggable === false &&
    event.type.indexOf("mouse") !== -1
  ) {
    return;
  }

  _.touchObject.fingerCount =
    event.originalEvent && event.originalEvent.touches !== undefined
      ? event.originalEvent.touches.length
      : 1;

  _.touchObject.minSwipe = _.listWidth / _.options.touchThreshold;

  if (_.options.verticalSwiping === true) {
    _.touchObject.minSwipe = _.listHeight / _.options.touchThreshold;
  }

  switch (event.data.action) {
    case "start":
      _.swipeStart(event);
      break;

    case "move":
      _.swipeMove(event);
      break;

    case "end":
      _.swipeEnd(event);
      break;
  }
};

Slick.prototype.swipeMove = function (event) {
  var _ = this,
    edgeWasHit = false,
    curLeft,
    swipeDirection,
    swipeLength,
    positionOffset,
    touches,
    verticalSwipeLength;

  touches =
    event.originalEvent !== undefined ? event.originalEvent.touches : null;

  if (!_.dragging || _.scrolling || (touches && touches.length !== 1)) {
    return false;
  }

  curLeft = _.getLeft(_.currentSlide);

  _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
  _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

  _.touchObject.swipeLength = Math.round(
    Math.sqrt(Math.pow(_.touchObject.curX - _.touchObject.startX, 2))
  );

  verticalSwipeLength = Math.round(
    Math.sqrt(Math.pow(_.touchObject.curY - _.touchObject.startY, 2))
  );

  if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
    _.scrolling = true;
    return false;
  }

  if (_.options.verticalSwiping === true) {
    _.touchObject.swipeLength = verticalSwipeLength;
  }

  swipeDirection = _.swipeDirection();

  if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
    _.swiping = true;
    event.preventDefault();
  }

  positionOffset =
    (_.options.rtl === false ? 1 : -1) *
    (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
  if (_.options.verticalSwiping === true) {
    positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
  }

  swipeLength = _.touchObject.swipeLength;

  _.touchObject.edgeHit = false;

  if (_.options.infinite === false) {
    if (
      (_.currentSlide === 0 && swipeDirection === "right") ||
      (_.currentSlide >= _.getDotCount() && swipeDirection === "left")
    ) {
      swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
      _.touchObject.edgeHit = true;
    }
  }

  if (_.options.vertical === false) {
    _.swipeLeft = curLeft + swipeLength * positionOffset;
  } else {
    _.swipeLeft =
      curLeft + swipeLength * (_.$list.height() / _.listWidth) * positionOffset;
  }
  if (_.options.verticalSwiping === true) {
    _.swipeLeft = curLeft + swipeLength * positionOffset;
  }

  if (_.options.fade === true || _.options.touchMove === false) {
    return false;
  }

  if (_.animating === true) {
    _.swipeLeft = null;
    return false;
  }

  _.setCSS(_.swipeLeft);
};

Slick.prototype.swipeStart = function (event) {
  var _ = this,
    touches;

  _.interrupted = true;

  if (
    _.touchObject.fingerCount !== 1 ||
    _.slideCount <= _.options.slidesToShow
  ) {
    _.touchObject = {};
    return false;
  }

  if (
    event.originalEvent !== undefined &&
    event.originalEvent.touches !== undefined
  ) {
    touches = event.originalEvent.touches[0];
  }

  _.touchObject.startX = _.touchObject.curX =
    touches !== undefined ? touches.pageX : event.clientX;
  _.touchObject.startY = _.touchObject.curY =
    touches !== undefined ? touches.pageY : event.clientY;

  _.dragging = true;
};

(function (factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if (typeof exports !== "undefined") {
    module.exports = factory(require("jquery"));
  } else {
    factory(jQuery);
  }
});
