(function($){
    $(function(){
        $('.button-collapse').sideNav();
    });
    $(document).ready(function(){
      $('.parallax').parallax();
    });
})(jQuery);


(function($) {
    var sentences = [
        "Nous ne rentrerons pas chez nous ce soir",
        "Ni loi, ni travail",
        "Un joyeux bordel est possible",
        "Le jour : à bout ; la nuit : debout",
        "Nos rêves ne rentrent pas dans vos urnes",
    ]
    var counter = 0;
    setInterval(function() {
        var container = $('.nd_header__quote');
        container
            .children()
            .fadeOut()
            .remove();
        container
            .append($('<span>"' + sentences[counter] + '"</span>').fadeIn())
        counter++;
        if (counter === sentences.length) {
            counter = 0;
        }
    }, 10000);
})(jQuery);