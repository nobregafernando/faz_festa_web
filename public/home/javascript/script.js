$(document).ready(function () {
    $('#mobile_btn').on('click', function () {
        $('#mobile_menu').toggleClass('active');
        $('#mobile_btn').find('i').toggleClass('fa-x');
    });

    const sections = $('section');
    const navItems = $('.nav-item');

    $(window).on('scroll', function () {
        const header = $('header');
        const scrollPosition = $(window).scrollTop() - header.outerHeight();

        if (scrollPosition <= 0) {
            header.css('box-shadow', 'none');
        } else {
            header.css('box-shadow', '5px 1px 5px rgba(0, 0, 0, 0.1)');
        }
 
        const scrollTop = $(window).scrollTop();
        let currentId = '';

        sections.each(function () {
            const sectionTop = $(this).offset().top - 100;
            const sectionBottom = sectionTop + $(this).outerHeight();

            if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
                currentId = $(this).attr('id');
                return false; 
            }
        });

        navItems.removeClass('active');

        navItems.each(function () {
            const href = $(this).find('a').attr('href');
            if (href === '#' + currentId) {
                $(this).addClass('active');
            }
        });
    });

    ScrollReveal().reveal('#cta',{
        origin: 'left',
        duration: 2000,
        distance: '20%',
    });

    ScrollReveal().reveal('.item-1', {
        origin: 'left',
        duration: 2000,
        distance: '20%',
    });
    ScrollReveal().reveal('.item-2', {
        origin: 'left',
        duration: 2000,
        distance: '20%',
    });

    ScrollReveal().reveal('.item-3', {
        origin: 'left',
        duration: 2000,
        distance: '20%',
    });

    ScrollReveal().reveal('.item-4', {
        origin: 'left',
        duration: 2000,
        distance: '20%',
    });

    ScrollReveal().reveal('#testimonials_avaliacao', {
        origin: 'left',
        duration: 1000,
        distance: '20%',
    });

 ScrollReveal().reveal('.feedback', {
        origin: 'right',
        duration: 1000,
        distance: '20%',
    });

});
