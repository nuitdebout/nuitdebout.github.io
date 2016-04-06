(function($){
    
    // collapse
    $('.button-collapse').sideNav();

    // parallax
    $('.parallax').parallax();
      

    // quote rotation
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


    // date calculation
    // To do


    // bambuser
    $.ajax({
      url: 'http://localhost:3000/api/bambuser',
      success: function (resp, status, jqxhr) {

        resp = JSON.parse(resp);

        if (resp && resp.result)
        {
          
        $('<iframe />');  // Create an iframe element
        $('<iframe />', {
            src: 'https://embed.bambuser.com/broadcast/' + resp.result[0].vid,
            width: '100%',
            height: '260px',
            frameborder: 'none'
        }).appendTo('#bambuser');
        }



      }
    })


})(jQuery);