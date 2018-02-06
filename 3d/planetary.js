jQuery(document).ready(function($){
    	// $(".category-info-plus").on('click',function(){
    	// 	var id = $(this).attr("id");
    	// 	$(".category-info").hide();
    	// 	$(".category-info-"+id).toggle();
    	// })
	function dialerAdjust(){
		var diameter = $(".home_container").width()+10;	
		var radius_val = diameter/2
		// console.log("c"+radius_val);

	    	var type = 1, //circle type - 1 whole, 0.5 half, 0.25 quarter
		    radius = radius_val+'px', //distance from center
		    start = -225, //shift start from 0
		    $elements = $('.main_circle .circle_wrapper'),
		    //$elements = $('li:not(:first-child)'),
		    numberOfElements = (type === 1) ?  $elements.length : $elements.length - 1, //adj for even distro of elements when not full circle
		    slice = 360 * type / numberOfElements;

		$elements.each(function(i) {
		    var $self = $(this),
		        rotate = slice * i + start,
		        rotateReverse = rotate * -1;
		        // console.log(rotate);
		    
		    $self.css({
		        'transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)'
		    });
		});

		if($(".cat_desc").length > 0){
			$(".cat_desc").fadeIn();
		}
	}

	dialerAdjust();

	$.fn.fitText = function( kompressor, options ) {

	    var settings = {
			'minFontSize' : Number.NEGATIVE_INFINITY,
			'maxFontSize' : Number.POSITIVE_INFINITY
		};

		return this.each(function() {
			var $this = $(this);              // store the object
			var compressor = kompressor || 1; // set the compressor
	
			if ( options ) { 
			  $.extend( settings, options );
			}
	
			// Resizer() resizes items based on the object width divided by the compressor * 10
			var resizer = function () {
				$this.css('font-size', Math.max(Math.min($this.width() / (compressor*10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize)));
			};

			// Call once to set.
			resizer();

			// Call on resize. Opera debounces their resize by default. 
			$(window).resize(resizer);
		});

	};

	/*
	 * Lettering plugin
	 *
	 * changed injector function:
	 *   add &nbsp; for empty chars.
	 */
	function injector(t, splitter, klass, after) {
		var a = t.text().split(splitter), inject = '', emptyclass;
		if (a.length) {
			$(a).each(function(i, item) {
				emptyclass = '';
				if(item === ' ') {
					emptyclass = ' empty';
					item='&nbsp;';
				}	
				inject += '<span class="'+klass+(i+1)+emptyclass+'">'+item+'</span>'+after;
			});	
			t.empty().append(inject);
		}
	}
	
	var methods 			= {
		init : function() {

			return this.each(function() {
				injector($(this), '', 'char', '');
			});

		},

		words : function() {

			return this.each(function() {
				injector($(this), ' ', 'word', ' ');
			});

		},
		
		lines : function() {

			return this.each(function() {
				var r = "eefec303079ad17405c889e092e105b0";
				// Because it's hard to split a <br/> tag consistently across browsers,
				// (*ahem* IE *ahem*), we replaces all <br/> instances with an md5 hash 
				// (of the word "split").  If you're trying to use this plugin on that 
				// md5 hash string, it will fail because you're being ridiculous.
				injector($(this).children("br").replaceWith(r).end(), r, 'line', '');
			});

		}
	};

	$.fn.lettering 			= function( method ) {
		// Method calling logic
		if ( method && methods[method] ) {
			return methods[ method ].apply( this, [].slice.call( arguments, 1 ));
		} else if ( method === 'letters' || ! method ) {
			return methods.init.apply( this, [].slice.call( arguments, 0 ) ); // always pass an array
		}
		$.error( 'Method ' +  method + ' does not exist on jQuery.lettering' );
		return this;
	};
	
	/*
	 * Arctext object.
	 */
	$.Arctext 				= function( options, element ) {
	
		this.$el	= $( element );
		this._init( options );
		
	};
	
	$.Arctext.defaults 		= {
		radius	: 0, 	// the minimum value allowed is half of the word length. if set to -1, the word will be straight.
		dir		: 1,	// 1: curve is down, -1: curve is up.
		rotate	: true,	// if true each letter will be rotated.
		fitText	: false // if you wanna try out the fitText plugin (http://fittextjs.com/) set this to true. Don't forget the wrapper should be fluid.
    };
	
	$.Arctext.prototype 	= {
		_init 				: function( options ) {
			
			this.options 		= $.extend( true, {}, $.Arctext.defaults, options );
			
			// apply the lettering plugin.
			this._applyLettering();
			
			this.$el.data( 'arctext', true );
			
			// calculate values
			this._calc();
			
			// apply transformation.
			this._rotateWord();
			
			// load the events
			this._loadEvents();
			
		},
		_applyLettering		: function() {
		
			this.$el.lettering();
			
			if( this.options.fitText )
				this.$el.fitText();
			
			this.$letters	= this.$el.find('span').css('display', 'inline-block');
		
		},
		_calc				: function() {
			
			if( this.options.radius === -1 )
				return false;
			
			// calculate word / arc sizes & distances.
			this._calcBase();
			
			// get final values for each letter.
			this._calcLetters();
		
		},
		_calcBase			: function() {
			
			// total word width (sum of letters widths)
			this.dtWord		= 0;
			
			var _self 		= this;
			
			this.$letters.each( function(i) {
								
				var $letter 		= $(this),
					letterWidth		= $letter.outerWidth( true );
				
				_self.dtWord += letterWidth;
				
				// save the center point of each letter:
				$letter.data( 'center', _self.dtWord - letterWidth / 2 );
				
			});
			
			// the middle point of the word.
			var centerWord = this.dtWord / 2;
			
			// check radius : the minimum value allowed is half of the word length.
			if( this.options.radius < centerWord )
				this.options.radius = centerWord;
			
			// total arc segment length, where the letters will be placed.
			this.dtArcBase	= this.dtWord;
			
			// calculate the arc (length) that goes from the beginning of the first letter (x=0) to the end of the last letter (x=this.dtWord).
			// first lets calculate the angle for the triangle with base = this.dtArcBase and the other two sides = radius.
			var angle		= 2 * Math.asin( this.dtArcBase / ( 2 * this.options.radius ) );
			
			// given the formula: L(ength) = R(adius) x A(ngle), we calculate our arc length.
			this.dtArc		= this.options.radius * angle;
			
		},
		_calcLetters		: function() {
			
			var _self 		= this,
				iteratorX 	= 0;
				
			this.$letters.each( function(i) {
					
				var $letter 		= $(this),
					// calculate each letter's semi arc given the percentage of each letter on the original word.
					dtArcLetter		= ( $letter.outerWidth( true ) / _self.dtWord ) * _self.dtArc,
					// angle for the dtArcLetter given our radius.
					beta			= dtArcLetter / _self.options.radius,
					// distance from the middle point of the semi arc's chord to the center of the circle.
					// this is going to be the place where the letter will be positioned.
					h				= _self.options.radius * ( Math.cos( beta / 2 ) ),
					// angle formed by the x-axis and the left most point of the chord.
					alpha			= Math.acos( ( _self.dtWord / 2 - iteratorX ) / _self.options.radius ),
					// angle formed by the x-axis and the right most point of the chord.
					theta 			= alpha + beta / 2,
					// distances of the sides of the triangle formed by h and the orthogonal to the x-axis.
					x				= Math.cos( theta ) * h,
					y				= Math.sin( theta ) * h,
					// the value for the coordinate x of the middle point of the chord.
					xpos			= iteratorX + Math.abs( _self.dtWord / 2 - x - iteratorX ),
					// finally, calculate how much to translate each letter, given its center point.
					// also calculate the angle to rotate the letter accordingly.
					xval	= 0| xpos - $letter.data( 'center' ),
					yval	= 0| _self.options.radius - y,
					angle 	= ( _self.options.rotate ) ? 0| -Math.asin( x / _self.options.radius ) * ( 180 / Math.PI ) : 0;
				
				// the iteratorX will be positioned on the second point of each semi arc
				iteratorX = 2 * xpos - iteratorX;
				
				// save these values
				$letter.data({
					x	: xval,
					y	: ( _self.options.dir === 1 ) ? yval : -yval,
					a	: ( _self.options.dir === 1 ) ? angle : -angle
				});
					
			});
		
		},
		_rotateWord			: function( animation ) {
			
			if( !this.$el.data('arctext') ) return false;
			
			var _self = this;
			
			this.$letters.each( function(i) {
				
				var $letter 		= $(this),
					transformation	= ( _self.options.radius === -1 ) ? 'none' : 'translateX(' + $letter.data('x') + 'px) translateY(' + $letter.data('y') + 'px) rotate(' + $letter.data('a') + 'deg)',
					transition		= ( animation ) ? 'all ' + ( animation.speed || 0 ) + 'ms ' + ( animation.easing || 'linear' ) : 'none';
				
				$letter.css({
					'-webkit-transition' : transition,
					'-moz-transition' : transition,
					'-o-transition' : transition,
					'-ms-transition' : transition,
					'transition' : transition
				})
				.css({
					'-webkit-transform' : transformation,
					'-moz-transform' : transformation,
					'-o-transform' : transformation,
					'-ms-transform' : transformation,
					'transform' : transformation
				});
			
			});
			
		},
		_loadEvents			: function() {
			
			if( this.options.fitText ) {
			
				var _self = this;
				
				$(window).on( 'resize.arctext', function() {
					
					_self._calc();
					
					// apply transformation.
					_self._rotateWord();
					
				});
			
			}
		
		},
		set					: function( opts ) {
			
			if( !opts.radius &&  
				!opts.dir &&
				opts.rotate === 'undefined' ) {
					return false;
			}
			
			this.options.radius = opts.radius || this.options.radius;
			this.options.dir 	= opts.dir || this.options.dir;
			
			if( opts.rotate !== undefined ) {
				this.options.rotate = opts.rotate;
			}	
			
			this._calc();
			
			this._rotateWord( opts.animation );
			
		},
		destroy				: function() {
			
			this.options.radius	= -1;
			this._rotateWord();
			this.$letters.removeData('x y a center');
			this.$el.removeData('arctext');
			$(window).off('.arctext');
			
		}
	};
	
	var logError 			= function( message ) {
		if ( this.console ) {
			console.error( message );
		}
	};
	
	$.fn.arctext			= function( options ) {
	
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
				var instance = $.data( this, 'arctext' );
				
				if ( !instance ) {
					logError( "cannot call methods on arctext prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for arctext instance" );
					return;
				}
				
				instance[ options ].apply( instance, args );
			
			});
		
		} 
		else {
		
			this.each(function() {
			
				var instance = $.data( this, 'arctext' );
				if ( !instance ) {
					$.data( this, 'arctext', new $.Arctext( options, this ) );
				}
			});
		
		}
		
		return this;
		
	};
	
	if( $('.example1').length ){
		var $example1	= $('.example1').hide();		
	}

	if( $('.example2').length ){
		var $example2	= $('.example2').hide();
	}

	// google.load('webfont','1');
			
	// 		google.setOnLoadCallback(function() {
	// 			WebFont.load({
	// 				google		: {
	// 					families	: ['Montserrat','Concert One']
	// 				},
	// 				fontactive	: function(fontFamily, fontDescription) {
	// 					init();
	// 				},
	// 				fontinactive	: function(fontFamily, fontDescription) {
	// 					init();
	// 				}
	// 			});
	// 		});

			if( $('.example1').length ){				
				$example1.show().arctext({radius: 32});
			}
			if( $('.example2').length){				
				$example2.show().arctext({radius: 32});
			}

	$.urlParam = function(name){
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (results==null){
			return null;
		}
		else{
			return decodeURI(results[1]) || 0;
		}
	}

	if($("body.cms-home, body.cms-residential-services, body.category-pest-control-services").length > 0){
		if($("body.cms-home .home_container.home, body.cms-residential-services .home_container.home, body.category-pest-control-services .home_container.home").length > 0){
		if($.urlParam('cat_id') == null || $.urlParam('cat_id') == 2){
			// alert( "hello");
			$("body").addClass("cms-planetory-dialer");			
		}
		}	
	}

	$( document ).ajaxComplete(function() {
		if($("body.cms-home, body.cms-residential-services, body.category-pest-control-services").length > 0){
			if($("body.cms-home .home_container.home, body.cms-residential-services .home_container.home, body.category-pest-control-services .home_container.home").length > 0){
			// alert( "gello");
			if($.urlParam('cat_id') == null || $.urlParam('cat_id') == 2){
				$("body").addClass("cms-planetory-dialer");			
			}
		}
		}	
	});

	var waitForFinalEvent = (function () {
	  var timers = {};
	  return function (callback, ms, uniqueId) {
	    if (!uniqueId) {
	      uniqueId = "Don't call this twice without a uniqueId";
	    }
	    if (timers[uniqueId]) {
	      clearTimeout (timers[uniqueId]);
	    }
	    timers[uniqueId] = setTimeout(callback, ms);
	  };
	})();

	$(window).resize(function(){
		 waitForFinalEvent(function(){
		      	dialerAdjust();
		    }, 100)
	})

/*minicart - arrow up and down button*/ 
	$(document).ready(function(){

		// $('.svg_inner').addClass("show_svg");

	       $('.minicart-up-arrow').on('click',function(){
	         var $qty=$(this).closest('.qty').find('.qty-number');
	         var currentVal = parseInt($qty.val());
	         if (!isNaN(currentVal)) {
	             $qty.val(currentVal + 1);
	         }
	     });
	     $('.minicart-down-arrow').on('click',function(){
	         var $qty=$(this).closest('.qty').find('.qty-number');
	         var currentVal = parseInt($qty.val());
	         if (!isNaN(currentVal) && currentVal > 0) {
	             $qty.val(currentVal - 1);
	         }
	     });

		// var colorarray = ["#1abc9c","#2ecc71","#3498db","#2980b9","#e74c3c","#c0392b","#e67e22","#d35400","#f39c12","#f1c40f","#34495e","#2c3e50","#000" ];
		// 	var counter= 0;
		// 	function randomFrom() {
		// 		if(counter > colorarray.length)
		// 		counter = 0;
		// 		return colorarray[counter++];
		// 	}
		// 	var clearinter = setInterval(function(){
		// 		var strokeColor = randomFrom();
		// 		$('.svg_inner .path').attr("stroke",strokeColor);
		// 		// $('.svg_inner .path').attr("fill",strokeColor);
		// 		// console.log(strokeColor);
		// 	},1500);	

	     // jQuery(window).bind('load',function(){
	     // 	clearInterval(clearinter);
	     // 	$('.svg_inner .path').addClass("after_load");
	     // 	setTimeout(function(){  $('.svg_inner .path').attr("fill","#00bd7b");},500);
	     // 	setTimeout(function(){ $('.svg_inner .path').attr("stroke","#00bd7b");},500);
	     // 	setTimeout(function(){ $('.svg_inner').addClass("off_svg");},1500);
	     // 	setTimeout(function(){ $('.svg_inner').fadeOut();},2000);
	     // 	setTimeout(function(){ $(".home_container ").addClass("onactive");},2300);
	     // 	setTimeout(function(){ $(".main_cat_name ").addClass("main_circle_coming")}, 3200);
	     // 	setTimeout(function(){ $(".circle_wrapper").addClass("after_coming")}, 4000);
	     // 	setTimeout(function(){ $(".reverse_circle").addClass("circle_coming")}, 4000);
	     // 	setTimeout(function(){ $(".title_dialer").addClass("incoming_title")}, 4500);
	     // 	setTimeout(function(){$(".cat_desc ").addClass("incoming");}, 4700);
	     // 	setTimeout(function(){$(".home_container ").addClass("remove_after");}, 4700);

	     // })


		



	     // $(".circle_wrapper  ").hover(function(){
	     // 	$(".circle_wrapper ").toggleClass("blur");
	     // 	$(this).removeClass("blur");
	     // })

	      equalheight = function(container){
	      	// alert("hi");
		        var currentTallest = 0,
		            currentRowStart = 0,
		            rowDivs = new Array(),
		            $el,
		            topPosition = 0;
		        jQuery(container).each(function() {
		        	// alert("yes");
		          $el = jQuery(this);
		          jQuery($el).height('auto')
		          topPostion = $el.position().top;

		          if (currentRowStart != topPostion) {
		            for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
		              rowDivs[currentDiv].height(currentTallest);
		            }
		            rowDivs.length = 0; // empty the array
		            currentRowStart = topPostion;
		            currentTallest = $el.height();
		            rowDivs.push($el);
		          } else {
		            rowDivs.push($el);
		            currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
		         }
		          for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
		            rowDivs[currentDiv].height(currentTallest);
		          }
		        });
		        }

		        
		         equalheight('.shipping-address-items .shipping-address-item');
		      

		        $(window).resize(function(){
		         equalheight('.shipping-address-items .shipping-address-item');
		         //equalheight('.event-listing .event-content');
		        });

		         $( document ).ajaxComplete(function() {
		         equalheight('.shipping-address-items .shipping-address-item');
		         //equalheight('.event-listing .event-content');
		        });
	 })
/*End minicart - arrow up and down button*/
});