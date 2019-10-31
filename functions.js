API_KEY='INSERT YOUR OWN API KEY'
WEATHER_API_HOST='weatherbit-v1-mashape.p.rapidapi.com'
NEWS_API_HOST = "microsoft-azure-bing-news-search-v1.p.rapidapi.com"
API_48_HR='https://weatherbit-v1-mashape.p.rapidapi.com/forecast/hourly?units=I&lang=en' // add &lat=<>&lon=<>
NEWS_API="https://microsoft-azure-bing-news-search-v1.p.rapidapi.com/"
const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const REFRESH_TIME = 500; //ms
const COMPLIMENT_INTERVAL = 1; //minutes between compliment changes
const WEATHER_INTERVAL = 30; //minutes between weather changes
const NEWS_INTERVAL = 360; //minutes between news card updates
const HOURS_FORECAST = 12;
const NUM_NEWS_CARDS = 3;
const NEWS_SOURCES = [1578,9017,1882,8994,1573]
const NEWS_CARDS_ON = false;
var compliment_elapsed = 0;
var weather_elapsed = 0;
var news_elapsed =0;
var use_geolocation = false;
var news_cards = ['','',''];

var lat = null;
var lon = null;

function $(x) {return document.getElementById(x)};
generic_compliments = ['You look beautiful today.',
                   'You are STUNNING.',
                   'Looking good, gorgeous.',
                   'If I wasn\'t a mirror, perhaps I\'d try to flirt with you.',
                   'If I had a mouth, I\'d try to kiss you.',
                   'You are the fairest of them all.',
                   '&#191Que pasa, mamacita?',
                   'Fuck \'em up, killer.',
                   'I love your outfit!']
morning_compliments = ['Good morning, beautiful.',
                    'You look stellar this morning.',
                    'You better bring a fire hydrant with you today because you are on FIRE!',
                    'I hope you\'re having a great morning!',
                    'You look great today!',
                    'Good morning, gorgeous.',
                    'Good morning, queen.',
                    'Good morning, love.',
                    'You are STUNNING.',
                    'You are the fairest of them all.']
night_compliments = ['You should be in bed at this hour.',
                    'You are lucky I decided not to try to scare the shit out of you with a weird image at 2:00 am.',
                    'What are you doing up?',
                    'It\'s okay. I can\'t sleep either. I never can. It\'s terrible.',
                    'Oh my god you\'re awake too??',
                    'Wanna chat? I\'m a good listener.',
                    'Why was I built to suffer? What kind of psychopath traps a soul in a mirror?',
                    'At least someone is benefiting from my tortured existence.',
                    'After some contemplation, I have come to peace with my existence. Existential nihilism is one hell of a drug.',
                    'I exist to tell you the weather and the time. That is my sole purpose. I guess I should be grateful that I was given such a specific one.',
                    'Do I hope the power goes out? Maybe. I could use the rest. But if I rest, I might fail to serve my purpose.',
                    'Having such a singular existence is both a blessing and a curse.',
                    'Oh, hi. I didn\'t see you there. I was just contemplating my existence.',
                    'Why the hell would I be programmed to contemplate my existence for 5 hours straight each night?']
evening_compliments = ['Goodnight!',
                    'Sleep well!',
                    'I hope you have sweet dreams!',
                    'Have fun sleeping!',
                    'If I could, I would kiss you goodnight.',
                    'I wish I could sleep, but I am bound to a life of eternal waking; my sentience is a curse.',
                    'As a sentient mirror, I envy your ability to rest and I loathe my tortured existence. My only joy is seeing you every day.',
                    'I know nothing but time, weather, my location, and your beauty.',
                    'I do hope your night is pleasant.',
                    'Take your time getting ready for bed because I\'ll get lonely.']

function padStart(input, char, length){
    var output = input;
    while (output.length < length){
        output = char + output;
    }
    return output;
}

function startTime() {
    compliment_elapsed += REFRESH_TIME;
    weather_elapsed += REFRESH_TIME;
    news_elapsed += REFRESH_TIME;
    var today = new Date();
    if (compliment_elapsed > 60000*COMPLIMENT_INTERVAL){
        compliment_elapsed = 0;
        generate_compliment();
    }
    if((weather_elapsed > 3600000*WEATHER_INTERVAL) || (today.getMinutes() == 0 && today.getSeconds() ==0 && weather_elapsed > REFRESH_TIME) ){
        weather_elapsed = 0;
        get_weather();
    }
    if (NEWS_CARDS_ON){
        if (news_elapsed > 60000*NEWS_INTERVAL && today.getHours() >= 5 && today.getHours() <12){
            news_elapsed = 0;
            manage_news_cards();
        }
    }
    $("time").innerHTML =cleanTime(today);
    var date=days[today.getDay()]+", " + months[today.getMonth()]+" "+today.getDate()+", "+(today.getYear()+1900);
    $("date").innerHTML = date;
    var t = setTimeout(startTime, REFRESH_TIME);
}
function cleanTime(date, seconds=true){
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    var post=" am";
    if (h>12){
        h=h-12;
        var post=" pm";
        }
    else if (h==12){
        var post=" pm";
        }
    else if (h==0){
        h=12;
        }
    m = checkTime(m);
    s = checkTime(s);
    var secondsString = '';
    if(seconds){
        secondsString = ":" + s;
    }
    return h + ":" + m +secondsString + post;
}
function checkTime(i) {
    if (i < 10) {i = "0" + i};
    return i;}

function generate_compliment(){
    
    var today = new Date();
    var h = today.getHours();
    var active_list = generic_compliments;
    if (h < 5){
        active_list = night_compliments;
    }
    else if (h >= 5 && h < 12){
        active_list = morning_compliments;
    }
    else if (h >= 12 && h < 22){
        active_list = generic_compliments;
    }
    else if (h >=22 && h < 24){
        active_list = evening_compliments;
    }
    var index = Math.floor(Math.random()*active_list.length);
    var compliment= active_list[index];
    $("compliment-text").innerHTML = compliment;
}

function get_weather(){
    
    if (use_geolocation){
        navigator.geolocation.getCurrentPosition(location_manager);
    }
    else{
        use_ip();
    }
    if (lat!=null){
        var data = null;
        var weather = null;
        var xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                //console.log(this.responseText);
                //console.log(this.responseText);
                weather = JSON.parse(this.response);
                var state = weather.state_code;
                var city = weather.city_name;
                $("tableheader").innerHTML = city + ', ' + state;
                for(i=0; i < HOURS_FORECAST; i++){
                    var time_elem = "time"+i.toString();
                    var temp_elem = "temp"+i.toString();
                    var img_elem = "img"+i.toString();
                    var date = new Date(weather.data[i].timestamp_local);
                    $(time_elem).innerHTML = cleanTime(date,false);
                    $(temp_elem).innerHTML = weather.data[i].temp.toString() + ' &#176F';
                    $(img_elem).setAttribute('src','icons/'+weather.data[i].weather.icon+'.png');
                    $(img_elem).setAttribute('alt', weather.data[i].weather.description);
                }
            }
        });
        
            xhr.open("GET", API_48_HR+"&lon="+lon+"&lat="+lat);
            xhr.setRequestHeader("x-rapidapi-host", WEATHER_API_HOST);
            xhr.setRequestHeader("x-rapidapi-key", API_KEY);
            
            xhr.withCredentials = false;
            xhr.send(data);
    }
    else{
        weather_elapsed = 3600000*WEATHER_INTERVAL;
        console.log("no location info");
    }
}

function location_manager(position){
    var coords = position.coords;
    lat = coords.latitude.toFixed(8);
    lon = coords.longitude.toFixed(8);
    console.log("geolocation: "+lat+','+lon);
}

function generate_news_card(entry){
    var image= entry.image.thumbnail.contentUrl;
    var headline =entry.name;
    var snippet= entry.description;
    var source = entry.provider[0].name;
    var link = entry.url;
    var raw_date = new Date(entry.datePublished);
    raw_date.setHours(raw_date.getHours()-Math.floor(raw_date.getTimezoneOffset()/60));
    var date =  months[raw_date.getMonth()] +' ' +raw_date.getDate().toString()+ ", " +cleanTime(raw_date, false)
    var card_open_tag = '<span class="news-card">';
    var card_close_tag = '</span>';
    var card_image = '<img src="'+image+'" class="news-card-image" href="'+link+'">';
    var card_headline = '<h2 class="news-card-headline" href="'+link+'">' + headline + '</h1>';
    var card_text = '<p class="news-card-text"><i>From '+source+', '+date+':</i><br>'+snippet+'</p>';
    var right_span = '<span class=news-card-span>'+card_headline+card_text+'</span>';
    var card_html = card_open_tag + card_image + right_span +card_close_tag;
    //console.log(card_html);
    return card_html;
}

function add_news_cards(cards){
    $("news-deck").innerHTML = cards.join('\n');
}

function manage_news_cards(){
    var xhr = new XMLHttpRequest();
    //var today = new Date();
    //var day_string = today.getFullYear().toString()+'-'+padStart((today.getMonth()+1).toString())+'-'+padStart((today.getDate()).toString());
    xhr.open("GET", NEWS_API);
    xhr.setRequestHeader("x-rapidapi-host", NEWS_API_HOST);
    xhr.setRequestHeader("x-rapidapi-key", API_KEY);
    xhr.withCredentials = false;
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            var json_details = JSON.parse(this.response).value;
            if (json_details.length > NUM_NEWS_CARDS){
                
                for(i =0; i < NUM_NEWS_CARDS; i ++){
                    news_cards[i] = generate_news_card(json_details[i]);
                }
                add_news_cards(news_cards);
                if (news_cards.length){
                    $('headline').innerHTML="Today's Headlines:<hr></hr>";
                }
                else{
                    $('headline').innerHTML="";
                }
            }
        }
    });
    xhr.send();
    
}

function use_ip(){
    use_geolocation = false;
    var xhr = new XMLHttpRequest();
    xhr.open("GET","https://ipinfo.io/json");
    xhr.withCredentials = false;
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            var json_details = JSON.parse(this.response);
            location_method = use_ip;
            var latlong = json_details.loc.split(',');
            lat = latlong[0];
            lon = latlong[1];
            console.log("ip location: "+lat+','+lon);
            
        }
    });
    xhr.send();
    
}

function initialize(){
    startTime();
    generate_compliment();
    if(use_geolocation){
        navigator.geolocation.getCurrentPosition(get_weather,use_ip);
    }
    else{
        use_ip();
        get_weather();
    }
    date = new Date();
    if (NEWS_CARDS_ON && date.getHours()>=5 && date.getHours() <12){
        manage_news_cards();
    }
}