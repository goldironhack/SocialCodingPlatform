const $ = window.jQuery = window.$ = require("jquery");

$(function () {
    require("./bootstrap.min");
    require("./plugins");

    /*--
    Mobile Menu
    ------------------------*/
    $('.mobile-menu nav').meanmenu({
        meanScreenWidth: "990",
        meanMenuContainer: ".mobile-menu",
        onePage: true,
    });

    /*--
    slick slider
    ------------------------*/
    $('.slider-2').slick({
      centerMode: true,
      dots: true,
      centerPadding: '0',
      slidesToShow: 1,
      arrows: false,
      autoplay: true,
      autoplaySpeed: 7000,
      responsive: [
        {
          breakpoint: 970,
          settings: {
            slidesToShow: 1,
          }
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 1,
          }
        }
      ]
    });

    /*--------------------------
    counterUp
    ---------------------------- */
     $('.timer').counterUp({
        delay: 10,
        time: 5000
    });

    /*--
    slick slider
    ------------------------*/
    $('.item_all').slick({
      centerMode: true,
      dots: true,
      centerPadding: '0',
      slidesToShow: 7,
      arrows: false,
      autoplay: true,
      autoplaySpeed: 1000,
      responsive: [
        {
          breakpoint: 800,
          settings: {
            slidesToShow: 4,
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
          }
        }
      ]
    });

    /*--
    Menu Stick
    -----------------------------------*/
    if ($('.sticker')[0]){
        $('.sticker');
        $(window).scroll(function(){
            var wind_scr = $(window).scrollTop();
            var window_width = $(window).width();
            var head_w = $('.sticker').height();
            if (window_width >= 10) {
                if(wind_scr < 400){
                    if($('.sticker').data('stick') === true){
                        $('.sticker').data('stick', false);
                        $('.sticker').stop(true).animate({opacity : 0}, 300, function(){
                            $('.sticker').removeClass('stick slideDown');
                            $('.sticker').stop(true).animate({opacity : 1}, 300);
                        });
                    }
                } else {
                    if($('.sticker').data('stick') === false || typeof $('.sticker').data('stick') === 'undefined'){
                        $('.sticker').data('stick', true);
                        $('.sticker').stop(true).animate({opacity : 0},300,function(){
                            $('.sticker').addClass('stick slideDown');
                            $('.sticker.stick').stop(true).animate({opacity : 1}, 300);
                        });
                    }
                }
            }
        });
    };

    /*--
    One Page Nav
    -----------------------------------*/
    var top_offset = $('.main-menu').height() - -60;
    $('.main-menu nav ul').onePageNav({
        currentClass: 'active',
        scrollOffset: top_offset,
    });

    /*--
    Smooth Scroll
    -----------------------------------*/
    $('.scroll-down, .mean-nav ul li a').on('click', function(e) {
        e.preventDefault();
        var link = this;
        $.smoothScroll({
          offset: -100,
          scrollTarget: link.hash
        });
    });

    /*--------------------------
    scrollUp
    ---------------------------- */
    $(window).on('scroll',function () {
        if($(window).scrollTop()>200) {
            $("#toTop").fadeIn();
        } else {
            $("#toTop").fadeOut();
        }
    });
    $('#toTop').on('click', function() {
        $("html,body").animate({
            scrollTop:0
        }, 500)
    });
});
