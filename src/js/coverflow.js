/* global jQuery, CSSStyleDeclaration */

/**
 * @license Released under the MIT license.
 * 
 * CoverflowJS
 *
 * Refactored for jQuery 1.8 / jQueryUI 1.9 Sebastian Sauer
 * Re-written for jQueryUI 1.8.6/jQuery core 1.4.4+ by Addy Osmani with adjustments
 * Maintenance updates for 1.8.9/jQuery core 1.5, 1.6.2 made.
 * Original Component: Paul Bakaus for jQueryUI 1.7
 * 3D transformations: Brandon Belvin
 *
 * Depends:
 *  jquery.ui.core.js
 *  jquery.ui.widget.js
 *  jquery.ui.effect.js
 *  jquery.copycss.js
 *
 * - in case you want swipe support and you don't use jQuery mobile yet:
 * jquery-mobile.custom.js
 *
 * Events:
 *  beforeselect
 *  select
 */

(function( $, document, window ) {
	"use strict";
	
	/**
	 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	 * 
	 * requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
	 * MIT license
	 * 
	 * @see https://gist.github.com/paulirish/1579671
	 */

	var el = document.body || document.documentElement,
		style = el.style,
		lastTime = 0,
		vendors = [ "ms", "moz", "webkit", "o" ],
		vendorsLength = vendors.length,
		x = 0,
		capitalize = function( string ) {
			return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
		};
	
	for( ; x < vendorsLength && ! window.requestAnimationFrame; ++x ) {
		window.requestAnimationFrame = window[ vendors[ x ] + "RequestAnimationFrame" ];
		window.cancelAnimationFrame = window[ vendors[ x ] + "CancelAnimationFrame" ] ||
			window[ vendors[ x ] + "CancelRequestAnimationFrame" ];
	}
	
	if ( ! window.requestAnimationFrame ) {
		window.requestAnimationFrame = function( callback /* , element */ ) {
			var currTime = new Date().getTime(),
				timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) ),
				id = window.setTimeout( function() {
					callback( currTime + timeToCall ); 
				}, timeToCall );
			
			lastTime = currTime + timeToCall;
			
			return id;
		};
	}
	
	if ( ! window.cancelAnimationFrame ) {
		window.cancelAnimationFrame = function( id ) {
			clearTimeout(id);
		};
	}

	$.support.transform = "transform" in style ? "transform" : false;

	$.support.transition = "transition" in style ? "transition" : false;

	if( ! $.support.transform || ! $.support.transition ) {

		$.each( vendors, function( i, p ) {

			if( p !== "ms" ) {
				p = capitalize( p );
			}
			if( ! $.support.transform ) {
				if( p + "Transform" in style ) {
					$.support.transform = p + "Transform";
				}
			}
			if( ! $.support.transition ) {
				if( p + "Transition" in style ) {
					$.support.transition = p + "Transition";
				}
			}

			if( $.support.transform && $.support.transition ) {
				return false;
			}
			return true;
		});
	}

})( jQuery, document, window );

(function( $, document, window ) {
	"use strict";
	
	function appendCamelCase() {
		/**
		 * @see http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
		 */
		function capitalizeFirstLetter( string ) {
			return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
		}
		
		var strings = [], i = 0;
		
		for ( ; i < arguments.length; i++ ) {
			if ( typeof arguments[ i ] === "string" && arguments[ i ].length > 0 ) {
				if ( strings.length > 0 ) {
					strings.push( capitalizeFirstLetter( arguments[ i ] ) );
				}
				else {
					strings.push( arguments[ i ] );
				}
			}
		}
		
		return strings.join( "" );
	}
	
	/**
	 * Determines the necessary CSS browser prefix. Defaults to "o" if no other found
	 * @see http://davidwalsh.name/vendor-prefix
	 */
	var browserPrefix = (function () {
		var styles = window.getComputedStyle( document.documentElement, "" ),
			pre = (Array.prototype.slice
				.call( styles )
				.join( "" )
				.match( /-(moz|webkit|ms)-/ ) || ( styles.OLink === "" && [ "", "o" ] )
			)[1];
		return {
			css : "-" + pre + "-",
			js : pre[0].toUpperCase() + pre.substr(1)
		};
	})();

	var availableCssTransitions = {

		/**
		 * @see http://matthewlein.com/ceaser/
		 *
		 * easing not available as css timing functions:
		 *
		 * easeInElastic
		 * easeOutElastic
		 * easeInOutElastic
		 *
		 * easeInBounce
		 * easeOutBounce
		 * easeInOutBounce
		 */


		// ease-in
		"easeInQuad" : "cubic-bezier( .55,.085,.68,.53 )",
		"easeInCubic": "cubic-bezier( .550, .055, .675, .190 )",
		"easeInQuart": "cubic-bezier( .895, .03, .685, .22 )",
		"easeInQuint": "cubic-bezier( .755, .05, .855, .06 )",
		"easeInSine" : "cubic-bezier( .47, 0, .745, .715 )",
		"easeInExpo" : "cubic-bezier( .95, .05, .795, .035 )",
		"easeInCirc" : "cubic-bezier( .6, .04, .98, .335 )",
		"easeInBack" : "cubic-bezier( .6, -.28, .735, .045 )",

		// ease-out
		"easeOutQuad" : "cubic-bezier( .25,.46,.45,.94 )",
		"easeOutCubic": "cubic-bezier( .215,.61,.355,1 )",
		"easeOutQuart": "cubic-bezier( .165, .84, .44, 1 )",
		"easeOutQuint": "cubic-bezier( .23, 1, .32, 1 )",
		"easeOutSine" : "cubic-bezier( .39, .575, .565, 1 )",
		"easeOutExpo" : "cubic-bezier( .19,1,.22,1 )",
		"easeOutCirc" : "cubic-bezier( .075, .82, .165, 1 )",
		"easeOutBack" : "cubic-bezier( .175, .885, .32, 1.275 )",

		// ease-in-out
		"easeInOutQuad" : "cubic-bezier( .455, .03, .515, .955 )",
		"easeInOutCubic": "cubic-bezier( .645, .045, .355, 1 )",
		"easeInOutQuart": "cubic-bezier( .77, 0, .175, 1 )",
		"easeInOutQuint": "cubic-bezier( .86, 0, .07, 1 )",
		"easeInOutSine" : "cubic-bezier( .445, .05, .55, .95 )",
		"easeInOutExpo" : "cubic-bezier( 1, 0, 0, 1 )",
		"easeInOutCirc" : "cubic-bezier( .785, .135, .15, .86 )",
		"easeInOutBack" : "cubic-bezier( .68, -.55, .265, 1.55 )"
	},
	eventsMap = {
		"transition":     "transitionend",
		"MozTransition":  "transitionend",
		"OTransition":    "oTransitionEnd",
		"WebkitTransition": "webkitTransitionEnd",
		"msTransition":   "MSTransitionEnd"
	},
	isOldie = (function() {

		if( $.browser !== undefined ) {
			// old jQuery versions and jQuery migrate plugin users
			return $.browser.msie && ( ( ~~$.msie.version ) < 10 );
		}

		var match = /(msie) ([\w.]+)/.exec( navigator.userAgent.toLowerCase() );

		return match !== null && match[ 1 ] && ( ~~ match[ 2 ] ) < 10;
	})();

	$.widget( "ui.coverflow", {

		options: {
			items: "> *",
			active: 0,
			duration : 400,
			easing: "easeOutQuint",
			// selection triggers
			trigger : {
				itemfocus : true,
				itemclick : true,
				mousewheel : true,
				swipe : true
			},
			
			angle: 60,
			scale: 0.85,
			overlap: 0.3
		},
		isTicking : false,
		_create: function () {

			var o = this.options;
			
			this.elementOrigStyle = this.element.attr( "style ") || "";

			this.items = this.element.find( o.items )
					// set tabindex so widget items get focusable
					// makes items accessible by keyboard
					.addClass( "ui-coverflow-item" )
					.prop( "tabIndex", 0 )
					.each( function () {
						var $this = $( this );
						$this.data( "coverflowbeforestyle", $this.attr( "style" ) || "" );
					});

			this.element
				.addClass( "ui-coverflow" )
				.parent()
				.addClass( "ui-coverflow-wrapper ui-clearfix" );

			if( o.trigger.itemfocus ) {
				this._on( this.items, { focus : this._select });
			}

			if( o.trigger.itemclick ) {
				this._on( this.items, { click : this._select });
			}

			if( o.trigger.mousewheel ) {
				this._on({
					mousewheel: this._onMouseWheel,
					DOMMouseScroll: this._onMouseWheel
				});
			}

			if( o.trigger.swipe ) {
				this._on({
					swipeleft: this.next,
					swiperight: this.prev
				});
			}

			this.useJqueryAnimate = ! ( $.support.transition && $.isFunction( window.requestAnimationFrame ));
			this.transformItems = (!! $.support.transform) || isOldie;

			this.coverflowrafid = 0;
		},
		_init : function () {

			var o = this.options,
				css = {};

			o.duration = ~~ o.duration;
			if( o.duration < 1 ) {
				o.duration = 1;
			}

			this.currentIndex = this._isValidIndex( o.active, true ) ? o.active : 0;
			this.activeItem = this.items
				.removeClass( "ui-state-active" )
				.eq( this.currentIndex )
				.addClass( "ui-state-active" );

			this.itemWidth = this.items.width();
			this.itemHeight = this.items.height();
			this.itemSize = this.items.outerWidth( true );
			this.outerWidth = this.element.parent().outerWidth( false );

			// make sure there's enough space
			css.width = this.itemWidth * this.items.length;

			// Center the actual parents' left side within its parent
			$.extend( css, this._getCenterPosition(), this._getPerspectiveOrigin() );
			this.element.css( css );

			// Jump to the first item
			this._refresh( 1, this._getFrom(), this.currentIndex );

			this.initialOffset = parseInt( this.activeItem.css( "left" ), 10 );

			this._trigger( "beforeselect", null, this._ui() );
			this._trigger( "select", null, this._ui() );
		},
		_getItemRenderedWidth : function( angle, scale ) {
			// Estimate the rendered width (not taking perspective into account)
			return Math.cos( angle * ( Math.PI / 180 ) ) * this.itemSize * scale;
		},
		_getCenterPosition : function ( index ) {
			var pos;
			
			var renderedWidth = this._getItemRenderedWidth( this.options.angle, this.options.scale );
			
			index = typeof index === "undefined" ? this.currentIndex : index;
			
			// Get default center
			pos = this.outerWidth / 2 - this.itemSize / 2;
			
			// Shift left based on the number of elements before selection
			pos -= index * renderedWidth;
			
			// Adjust back right for the overlap of the elements
			pos += index * renderedWidth * this.options.overlap;
			
			// Adjust for the padding
			pos -= parseInt( this.element.css( "paddingLeft" ), 10 ) || 0;

			return { left : pos };
		},
		_getPerspectiveOrigin : function () {
			// Center the perspective on the visual center of the container
			return {
				perspectiveOrigin : this.itemSize / 2 +
					( this.currentIndex *
						this._getItemRenderedWidth( this.options.angle, this.options.scale ) *
						( 1 - this.options.overlap )
					) + "px 45%"
			};
		},
		_isValidIndex : function ( index, ignoreCurrent ) {

			ignoreCurrent = !! ignoreCurrent;
			index = ~~index;
			return ( this.currentIndex !== index || ignoreCurrent ) && index > -1 && !! this.items.get( index );
		},
		_select: function ( ev ) {
			this.select( ev.currentTarget );
		},
		next : function () {
			return this.select( this.currentIndex + 1 );
		},
		prev : function () {
			return this.select( this.currentIndex - 1 );
		},
		_getFrom : function () {
			return Math.abs( this.previous - this.currentIndex ) <= 1 ?
				this.previousIndex :
					this.currentIndex + ( this.previousIndex < this.currentIndex ? -1 : 1 );
		},
		select : function( item ) {

			var o = this.options,
				index = ! isNaN( parseInt( item, 10 ) ) ?
					parseInt( item, 10 ) :
						this.items.index( item ),
				animation;

			if( ! this._isValidIndex( index ) ) {
				return false;
			}

			if( false === this._trigger(
					"beforeselect",
					null,
					this._ui(
						this.items.eq( index ), index
					)
				)
			) {
				return false;
			}

			if( this.isTicking ) {
				if( this.useJqueryAnimate ) {
					this.element.stop( true, false );
				} else {

					if( this.coverflowrafid ) {
						window.cancelAnimationFrame( this.coverflowrafid );
					}

					this.element
						.unbind( eventsMap[ $.support.transition ] );
				}
			}
			this.isTicking = true;

			this.previousIndex = this.currentIndex;
			this.options.active = this.currentIndex = index;

			animation = {
				coverflow : 1
			};

			$.extend( animation, this._getCenterPosition(), this._getPerspectiveOrigin() );

			if( this.useJqueryAnimate ) {
				this._animation( o, animation );
				return true;
			}

			$.extend( animation, {
				duration: o.duration,
				easing: o.easing
			});

			this._transition( animation );
			return true;
		},
		_animation : function( o, animation ) {

			var self = this,
				from = this._getFrom();

			// Overwrite $.fx.step.coverflow everytime again with custom scoped values for this specific animation
			$.fx.step.coverflow = function( fx ) {
				self._refresh( fx.now, from, self.currentIndex );
			};

			// 1. Stop the previous animation
			// 2. Animate the parent's left/top property so the current item is in the center
			// 3. Use our custom coverflow animation which animates the item

			this.element
				.animate(
					animation,
					{
						duration: o.duration,
						easing: o.easing
					}
				)
				.promise()
				.done(function() {
					self._onAnimationEnd.apply( self );
				});
		},
		_transition : function( o ) {

			var self = this,
				d = new Date(),
				from = this._getFrom(),
				to = this.currentIndex,
				transitionFn = availableCssTransitions[ o.easing ] || availableCssTransitions.easeOutQuint,
				loopRefresh = function() {
					var state = ( (new Date()).getTime() - d.getTime() ) / o.duration;

					if( state > 1 ) {
						self.isTicking = false;
					} else {
						self._refresh( state, from, to );
					}

					if( self.isTicking ) {
						self.coverflowrafid = window.requestAnimationFrame( loopRefresh );
					}
				},
				transition = {
					transitionProperty : "left",
					transitionDuration : o.duration + "ms",
					transitionTimingFunction : transitionFn,
					transitionDelay : "initial"
				},
				css, transitionPropertyName, activeProperty, propertyName;

			this.coverflowrafid = window.requestAnimationFrame( loopRefresh );
			
			// Query the element's active CSS in case a transition property is already defined
			css = $(this.element).getStyles();
			
			// TODO: Refactor to function
			$.each( [ "", browserPrefix.js ], function( i, prefix ) {
				transitionPropertyName = appendCamelCase.call( undefined, prefix, "transitionProperty" );
				
				activeProperty = css[ transitionPropertyName ];
				if ( activeProperty ) {
					
					// Transition property already defined, check if the one we want to add is present
					if ( activeProperty.indexOf( transition.transitionProperty ) < 0 ) {
						
						// Add transition property since it is not yet included
						$.each( transition, function( name, value ) {
							propertyName = appendCamelCase.call( undefined, prefix, name );
							css[ propertyName ] += ", " + value;
						});
					}
				} else {
					
					// Transition property not yet defined, add it
					$.each( transition, function( name, value ) {
						propertyName = appendCamelCase.call( undefined, prefix, name );
						css[ propertyName ] = value;
					});
				}
			});
			
			this.element
				.one( eventsMap[ $.support.transition ],
					function() {
						window.cancelAnimationFrame( self.coverflowrafid );

						self._refresh( 1, from, to );
						self._onAnimationEnd( self );
					}
				)
				.css( $.extend( css, this._getCenterPosition(), this._getPerspectiveOrigin() ) );
		},
		_onAnimationEnd : function() {

			this.isTicking = false;
			this.activeItem = this.items
					.removeClass( "ui-state-active" )
					.eq( this.currentIndex )
					.addClass( "ui-state-active" );

			// fire select after animation has finished
			this._trigger( "select", null, this._ui() );
		},
		_refresh: function( state, from, to ) {
			var self = this,
				renderedWidth = self._getItemRenderedWidth( self.options.angle, self.options.scale );

			this.element
				.parent()
				.scrollTop( 0 );

			this.items.each( function ( i ) {

				var side = ( ( i === to && from - to < 0 ) || i - to  > 0 ) ?
						"left" :
							"right",
					mod = ( i === to ) ?
						( 1 - state ) :
							( i === from ? state : 1 ),
					css = {
						zIndex: self.items.length + ( side === "left" ? to - i : i - to )
					},
					scale = 1 - ( mod * ( 1 - self.options.scale ) ),
					angle = side === "right" ? self.options.angle : - self.options.angle,
					matrixT, filters;
				
				// Adjust left to center active item in display window
				css.left = -i * self.itemSize +
					( mod * i * renderedWidth * ( 1 - self.options.overlap ) ) +
					( ( 1 - mod ) * i * renderedWidth * ( 1 - self.options.overlap ) );
						
				if( self.transformItems ) {
					
					if( isOldie && ! $.support.transform ) {
						
						// Fallback to matrix if the browser does not support transfrom
						matrixT = [
							scale, ( mod * ( side === "right" ? -0.2 : 0.2 ) ),
							0, scale,
							0, 0
						];

						// Adapted from Paul Baukus transformie lib
						if( ! this.filters[ "DXImageTransform.Microsoft.Matrix" ] ) {
							this.style.filter = (this.style.filter ? "" : " " ) + "progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\"auto expand\")";
						}
						filters = this.filters[ "DXImageTransform.Microsoft.Matrix" ];
						filters.M11 = matrixT[ 0 ];
						filters.M12 = matrixT[ 2 ];
						filters.M21 = matrixT[ 1 ];
						filters.M22 = matrixT[ 3 ];

					} else {
						// Invoke 3D transform
						css.transform = "rotateY(" + ( mod * angle ) + "deg) scale(" + scale + ")";
						css.transformOrigin = side === "right" ? "left center" : "right center";
					}
				}

				$( this ).css( css );

			});
		},
		_ui : function ( active, index ) {
			return {
				active: active || this.activeItem,
				index: typeof index !== "undefined" ? index : this.currentIndex
			};
		},
		_onMouseWheel : function ( ev ) {
			var origEv = ev.originalEvent;

			ev.preventDefault();
			if( origEv.wheelDelta > 0 || origEv.detail < 0 ) {
				this.prev();
				return;
			}
			this.next();
		},
		_destroy : function () {

			this.element
				.attr( "style", this.elementOrigStyle )
				.removeClass( "ui-coverflow" )
				.parent()
				.removeClass( "ui-coverflow-wrapper ui-clearfix" );

			this.items
				.removeClass( "ui-coverflow-item ui-state-active" )
				.each(function(){
					var $this = $( this );
					$this.attr( "style", $this.data( "coverflowbeforestyle" ) );
				});

			this._super();
		}
	});

})( jQuery, document, window );
