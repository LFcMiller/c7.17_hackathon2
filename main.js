/**
 * Global Variable to store all previously generated Painting Objects
 * @Global {Array} of {Objects}
 */
var allPaintings = [];
/**
 * Global Variable to store Artsy API Key
 * @Global String
 */
var API_Key = "";
/**
 * Global variable to store the index in allPaintings of the currently displayed painting
 * @Global {Number}
 */
var currentPainting = 0;
/**
 * Global variable to store how many paintings have been completely created
 * @Global {Number}
 */
var completedPaintings = 0;
/**
 * Global Variable to store information to build initial Splash Page
 * @Global {Object}
 */
var splashPage = new Painting();
splashPage.artistBiography = "Welcome to the Endless Gallery! With information pulled from four separate API's by the talented coding artists you see above, you can explore a vast collection of artworks, view that painting's artist and current location in the world, as well as read a short biography of the artist who created it, where available. This application was made with data pulled from the Artsy API, the Google Geocoding API, the Google Maps API, and the MediaWiki unofficial Wikipedia API. Thank you for taking the time to explore our Endless Gallery, and enjoy!";
splashPage.artistName = "Endless Gallery";
splashPage.paintingGallery = "LearningFuze, Irvine, CA";
splashPage.galleryCoordinates.latitude = 33.6348748;
splashPage.galleryCoordinates.longitude = -117.7404808;
splashPage.paintingImage = "assets/images/code_screen_shot.png";
splashPage.paintingMap = getMapElement(splashPage.galleryCoordinates.latitude, splashPage.galleryCoordinates.longitude);
splashPage.paintingTitle = "Agile Creation";
splashPage.artistImage = "assets/images/ourGroup.jpg";
allPaintings.push(splashPage);
/**
 * AJAX call to Artsy to receive current API Key
 * @return {JSON} Artsy API key
 */
function getAPIKey(){
    var deferred = $.Deferred();
    $.ajax({ //Random artwork lookup
        url: "https://api.artsy.net/api/tokens/xapp_token",
        method: "POST",
        dataType: "json",
        headers: {
            "Accept": "application/json",
        },
        data: {
            "client_id": "07de84579f1b1d4f2469",
            "client_secret": "7e525c19a317a2168862448aadd9e963"
        },
        success: deferred.resolve, //Function to begin diverging branches of Ajax chain
        error: deferred.reject
    });
    return deferred;
}
/**
 * AJAX call to Artsy to receive random artwork with information
 * @return {JSON} Painting image, painting title, painting ID, and gallery name (with conditional to check if empty)
 */
function getNewPainting(){
    $.ajax({ //Random artwork lookup
        url: "https://api.artsy.net/api/artworks?sample",
        method: "GET",
        dataType: "json",
        headers: {
            "X-Xapp-Token": API_Key,
        },
        success: startAjaxBranches, //Function to begin diverging branches of Ajax chain
        error: errorFunction
    });
}
/**
 * Function to take in response from initial painting creation call and check for presence of gallery, then start two branching AJAX chains with response as an argument.
 * @param {string} response
 * @return {undefined}
 */
function startAjaxBranches (response) {
    if (response.collecting_institution === "" || !("image" in response._links)) { //check if returned random painting has a home gallery
        return getNewPainting(); //if not, exit Ajax Chain, and begin new Ajax chain with finding new painting
    }
    var painting = new Painting(); //create painting object to store painting information throughout Ajax call
    painting.location = allPaintings.push(painting)-1; //push painting into our painting Array, and remember index of value pushed in using returned length from push
    getPaintingArtist(painting.location, response); //start Ajax Call to get Artist Name and portrait, passing in location in array and response from first Ajax call
    getGalleryLocation(painting.location, response); //start Ajax call to get Gallery coordinates, passing in location in array and response from first Ajax call
}
/**
 * AJAX call to Artsy to recieve Artist name and portrait from the painting ID
 * @param {string} location - The location of the painting gallery
 * @param {string} response - painting ID and XAPP token returned from the previous AJAX call
 * @return {JSON} Artist name and artist image
 */
function getPaintingArtist(location, response) {
    allPaintings[location].paintingID = response.id; //Set Painting ID from intial Ajax response passed down through startAjaxBranches
    try{
        allPaintings[location].paintingTitle = response.title; //try to set painting title to title in response
    } catch(err) {
        allPaintings[location].paintingTitle = "Untitled"; //if there is no title, set painting title to Untitled
    }
    allPaintings[location].paintingImage = allPaintings[location].setPaintingSize(response._links.image.href, "large"); //set painting image to url from response formatted with painting image size
    $.ajax({  //Artist Lookup
        url: "https://api.artsy.net/api/artists",
        method: "GET",
        dataType: "json",
        data: {
            "artwork_id": response.id
        },
        headers: {
            "X-Xapp-Token": API_Key,
        },
        success: getArtistBio.bind(this, location), //get artist biography from Wikipedia
        error: errorFunction
    });
}

/**
 * AJAX call to Google Geocoding to show the location of the home gallery
 * @param {string} location - Home gallery name
 * @param {string} response - the returned data from the previous AJAX call
 * @return {number} Latitude and Longitude of the gallery
 */
function getGalleryLocation(location, response) {
    allPaintings[location].paintingGallery = response.collecting_institution;
    $.ajax({ //Geocoding API
        url: "https://maps.googleapis.com/maps/api/geocode/json",
        method: "GET",
        dataType: "json",
        data: {
            address: allPaintings[location].replaceXwithY(allPaintings[location].paintingGallery, " ", "+"),
            key: "AIzaSyAaECqfgaoi_qM2RBsq8VYAuuFevWg3bhg"
        },
        success: getGalleryMap.bind(this, location), //make Google Map using coordinates
        error: errorFunction
    });
}
/**
 * AJAX call to Google Maps to display a map of the painting's housing gallery
 * @param {number} location - Latitude and Longitude of the housing gallery
 * @param {string} response - The response from the previous AJAX calls
 * @return {Object} jQuery wrapped DOM element to add to container div
 */
function getGalleryMap(location, response){
    allPaintings[location].galleryCoordinates.latitude = response.results[0].geometry.location.lat; //set painting's location latitude
    allPaintings[location].galleryCoordinates.longitude = response.results[0].geometry.location.lng; //set painting's location longitude
    var urlStr = "https://www.google.com/maps/embed/v1/view?key=AIzaSyDWPRK37JSNxBhmLhEbWzCQ57MQBQu8atk&center=" + allPaintings[location].galleryCoordinates.latitude + "," + allPaintings[location].galleryCoordinates.longitude + "&zoom=18&maptype=satellite";
    var iframeElement = $('<iframe>',{
        frameborder: "0",
        style: "border:0",
        src: urlStr
    });
    iframeElement.css({"width":"100%", "height":"100%"});
    allPaintings[location].paintingMap = iframeElement; //save map to painting
    checkForAjaxCompletion(location);
}
/**
 * Function to handle Google Map creation for Splash Page outside of Ajax Chain
 * @param lat
 * @param long
 * @return {Object} jQuery wrapped DOM element to add to container div
 */
function getMapElement(lat, long){
    var urlStr = "https://www.google.com/maps/embed/v1/view?key=AIzaSyDWPRK37JSNxBhmLhEbWzCQ57MQBQu8atk&center=" + lat + "," + long + "&zoom=18&maptype=satellite";
    var iframeElement = $('<iframe>',{
        frameborder: "0",
        style: "border:0",
        src: urlStr
    });
    iframeElement.css({"width":"100%", "height":"100%"});
    return iframeElement; //return map element to be saved in Splash Page
}
/**
 * AJAX call
 * @param {string} location - The location of the Painting Gallery
 * @param {string} response - Artist's name
 * @return {JSON} Artist's short biography from Wikipedia
 */
function getArtistBio(location, response) {
    try{ //try to set artist image to image in response
        allPaintings[location].artistImage = allPaintings[location].setPaintingSize(response._embedded.artists[0]._links.image.href, "square");
    } catch(err) { //if no image, catch with unknown artist image
        allPaintings[location].artistImage = "assets/images/unknownArtist.png";
    }
    try{ //try to set artist name to name in response
        allPaintings[location].artistName = response._embedded.artists[0].name;
        getArtistImage(location, response._embedded.artists[0].name);
    } catch(err) { //if no name, catch with Unknown Artist
        allPaintings[location].artistName = "Unknown Artist";
    }
    $.ajax({ //get first passage of Wikipedia of Artist
        url: "https://en.wikipedia.org/w/api.php",
        method: "GET",
        dataType: "jsonp",
        data: {
            action: "query",
            titles: allPaintings[location].artistName,
            format: "json",
            prop: "extracts",
            exintro: true,
            explaintext: true
        },
        success: successArtistBio.bind(this, location), //handle information returned from Ajax call
        error: errorFunction
    });
}
/**
 * AJAX call to get artist portrait from wikipedia.
 * @param artist_name
 * @param location
 */
function getArtistImage(location, artist_name){
    $.ajax({ //get first passage of Wikipedia of Artist
        url: "https://en.wikipedia.org/w/api.php",
        method: "GET",
        dataType: "jsonp",
        data: {
            action: "query",
            titles: artist_name,
            format: "json",
            prop: "pageimages",
            pithumbsize: 200
            //prop: "text|images",
            //exintro: true,
            //explaintext: true
        },
        success: successArtistImage.bind(this, location),
        error: errorArtistImage.bind(this, location)
    });
}
/**
 * Function to set Painting object's artist image if AJAX call is successful
 * @param location
 * @param response
 */
function successArtistImage(location, response){
    var pagesKeys = Object.keys(response.query.pages);
    try{
        allPaintings[location].artistImage = response.query.pages[pagesKeys[0]].thumbnail.source;
    }
    catch(err){
        console.log(err);
    }
    checkForAjaxCompletion(location);
}
/**
 * Error handler for artist image Mediawiki AJAX call.
 * @param location
 * @param response
 */
function errorArtistImage(location, response){
    console.log("Error querying Mediawiki for artist image", response);
    checkForAjaxCompletion(location);
}
/**
 * Function to handle completion of Artist Bio Ajax call
 * @Param response Data returned from Ajax call
 */
function successArtistBio (location, response) {
    var pageKey = Object.keys(response.query.pages); //remember key from subobject with randomized name
    allPaintings[location].artistBiography = response.query.pages[pageKey[0]].extract; //pull information within Object with randomized name using the 0 index of array of keys
    checkForAjaxCompletion(location);
}
/**
 * Function to check if all Ajax calls have been completed successfully, and change status to "no longer in ajax chain"
 * @Param none
 */
function checkForAjaxCompletion (location) {
    for(index in allPaintings[location]){ //check all values in painting being created
        if(allPaintings[location][index] === null) { //if any value is still null, exit function
            return;
        }
    }
    completedPaintings++;
    console.log(allPaintings[location]); //log out created painting
}
/**
 * Function to handle click on "back" button to see previous painting
 * @Param none
 */
function previousPainting(){
    $('.previousPainting, .nextPainting, .rotateTop, .rotateDown').off().removeClass('clickable'); //remove click handlers on button
    $('.rotateDown').css('bottom', '-10vmin'); //bottom click leave view
    $('.rotateTop').css('top', '-2vmin'); //put top button within view
    var $galleryColumn = $('.gallery_column'); //remember gallery column
    var newRotation = parseInt($galleryColumn.attr('rotation')) + 90; //parse integer of prior rotation then add 90 degrees to account for new rotation
    $galleryColumn.attr('rotation', newRotation); //set rotation to new degree value
    var currentFace = parseInt($galleryColumn.attr('currentFace')); //find current face value as number
    var faceToChange = currentFace - 2; //set face to change to two less than prior face
    if (faceToChange < 1) { //if face value to change is less than 1, roll value around to other side of cube e.g. if face is set to 0, true  face to change is actually 4
        faceToChange += 4;
    }
    rotateGallery(newRotation); //execute rotation function
    if (currentFace < 2) { //check to see if current face will be less than 1 after decrementing, account for change, if necessary
        currentFace += 4;
    }
    $galleryColumn.attr('currentFace', (currentFace-1)); //set current face to decremented value of prior value
    reset("gallery_wall_" + faceToChange); //reset gallery wall two spaces back to remove load time
    currentPainting--; //decrement current painting

    setTimeout(function() { //reapply click handlers when animation is done
        $('.nextPainting').addClass('clickable').on("click", nextPainting);
        $('.rotateTop').addClass('clickable').on("click", rotateTop);
        $('.rotateDown').addClass('clickable').on("click", rotateDown);
        if (currentPainting > 0) { //if on splash page, do not enable previous painting click handler
            allPaintings[currentPainting-1].populatePage(faceToChange); //populate page that was reset with painting at place prior to current painting value
            $('.previousPainting').addClass('clickable').on("click", previousPainting);
        }
    }, 2000);
}
/**
 * Function to handle click on "next" button to see next painting
 * @Param none
 */
function nextPainting(){
    $('.previousPainting, .nextPainting, .rotateTop, .rotateDown').off().removeClass('clickable'); //remove click handlers
    $('.rotateDown').css('bottom', '-10vmin'); //bottom click leave view
    $('.rotateTop').css('top', '-2vmin'); //put top button within view
    var $galleryColumn = $('.gallery_column');
    var newRotation = parseInt($galleryColumn.attr('rotation')) - 90; //parse integer of prior rotation then subtract 90 degrees to account for new rotation
    $galleryColumn.attr('rotation', newRotation);
    var currentFace = parseInt($galleryColumn.attr('currentFace'));
    var faceToChange = currentFace + 3; //set face to change to three more than prior face
    if (faceToChange > 4) { //if face value to change is higher than 4, roll value around to other side of cube e.g. if face is set to 5, true  face to change is actually 1
        faceToChange -= 4;
    }
    rotateGallery(newRotation);
    if (currentFace > 3) { //check to see if current face will be greater than 4 after decrementing, account for change, if necessary
        currentFace -= 4;
    }
    $galleryColumn.attr('currentFace', (currentFace+1)); //set current face to incremented value of prior value
    reset("gallery_wall_" + faceToChange); //reset gallery wall three spaces forward to remove load time
    getNewPainting(); //request for two more paintings to be made
    getNewPainting();
    currentPainting++;
    allPaintings[currentPainting + 2].populatePage(faceToChange); //populate face that was reset
    setTimeout(function() { //apply click handlers
        $('.rotateDown').addClass('clickable').on("click", nextPainting);
        $('.rotateTop').addClass('clickable').on("click", rotateTop);
        $('.nextPainting').addClass('clickable').on("click", nextPainting);
        $('.previousPainting').addClass('clickable').on("click", previousPainting);
    }, 2000)
}
/**
 * Function to handle Error in Ajax chain process
 * @Param err Error being returned
 */
function errorFunction(err){
    console.log("There was an error: ", err);
    allPaintings.pop();
    ajaxChainInProgress = false;
}
/**
 * Clears a gallery wall
 * @param gallery_wall - the class name of the gallery wall div intended to be cleared
 */
function reset(gallery_wall){
    $('.' + gallery_wall + ' .artistName').text(''); //sets Artist name to blank
    $('.' + gallery_wall + ' .artistBio').text(''); //sets artist bio to blank
    $('.' + gallery_wall + ' .map_image_div').empty(); //removes map element
}
/**
 * Function to return the first letterss of a string under a specified char limit
 * @param char_lim
 * @param  str
 * @return {string}
 */
function firstWordsUnderCharLim(char_lim, str){ //truncate painting title to fit on title plaque
    if(str.length <= char_lim) return str;
    var return_str = '';
    for(var i=0; i< char_lim - 3; i++){
        return_str += str[i];
    }
    return return_str + "...";
}
/**
 * Creates an instance of Painting
 *
 * @constructor
 * @this {Painting}
 */

function Painting() {
    /**
     * @Private Image of the Painting
     */
    this.paintingImage = null;

    /**
     * @Private Title of the Painting
     */
    this.paintingTitle = null;

    /**
     * @Private Artist Name
     */
    this.artistName = null;

    /**
     * @Private Artist Portrait
     */
    this.artistImage = null;

    /**
     * @Private Artist Bio
     */
    this.artistBiography = null;

    /**
     * @Private Painting Gallery
     */
    this.paintingGallery = null;

    /**
     * @private Latitude and Longitude of the Gallery
     */
    this.galleryCoordinates = {
        latitude: null,
        longitude: null
    };

    /**
     * @private ID of the Painting
     */
    this.paintingID = null;

    /**
     * @private ID of the Map
     */
    this.paintingMap = null;

    /**
     * Method to create a DOM image
     * @Param {string, string} What image to target and where to append the DOM image to
     */
    this.createImageDOM = function(targetImage, appendTarget) {
        $(appendTarget).css('background-image', 'url(' + targetImage +')');
    };

    /**
     * Method that calls all of the Methods to add DOM elements to the page
     * @param {number} galleryWallNumber is the number of the Gallery Wall to be populated
     */
    this.populatePage = function(galleryWallNumber) {
        this.createImageDOM(this.paintingImage, '.gallery_wall_' + galleryWallNumber + ' .painting_image_div'); //put painting image in frame on dom
        this.createImageDOM(this.artistImage, ' .gallery_wall_' + galleryWallNumber + ' .artist_image_div'); //put artist image in frame on dom
        $(".gallery_wall_" + galleryWallNumber + " .artistName").text(this.artistName); //add artist name to container
        $(".gallery_wall_" + galleryWallNumber + " .artistBio").text(this.artistBiography).scrollTop(0); //add artist bio to container
        $(".gallery_wall_" + galleryWallNumber + " .map_image_div").append(this.paintingMap); //add map to DOM
        $(".gallery_wall_" + galleryWallNumber + " .nameplate h3").text(firstWordsUnderCharLim(22, this.paintingTitle)).attr("title", this.paintingTitle); //place truncated title in container and set alt text to full title
    };
    /**
     * Method to take in a string and return it with all instances of "x" replaced with "y"
     * @param {string} string
     * @param {string} x
     * @param {string} y
     * @return {string}
     */
    this.replaceXwithY = function(string, x, y) {
        return string.split(x).join(y);
    };
    /**
     * Method to take in a url in string format and return it with default image_version placeholder replaced with desired image size
     * @param {string} url
     * @param {string} size
     * @return {string}
     */
    this.setPaintingSize = function(url, size) {
        return url.replace("{image_version}", size)
    }
}
/**
 * Function to rotate gallery on click
 * @Param {number} newRotation Number of degrees to rotate
 */
function rotateGallery(newRotation) {
    $('.gallery_column').css('transform','translate3d(-49vmin, 0, -49vmin) rotateY(' + newRotation + 'deg)');
}
/**
 * Function to rotate gallery to top of cube
 * @Param none
 */
function rotateTop() {
    $('.nextPainting, .previousPainting, .rotateTop, .rotateDown').removeClass('clickable').off();
    $('.gallery_column').css('transform','translate3d(-49vmin, 49vmin, 0) rotate3d(1, 0, 0, -90deg)');
    $('.rotateTop').css('top','-10vmin');
    $('.rotateDown').css('bottom','1vmin');
    setTimeout(function() {
        $('.nextPainting').addClass('clickable').on("click", nextPainting);
        if (currentPainting > 0) {
            $('.previousPainting').addClass('clickable').on("click", previousPainting);
        }
        $('.rotateTop').addClass('clickable').on("click", rotateTop);
        $('.rotateDown').addClass('clickable').on("click", rotateDown);
    }, 2000)
}

function openGalleryDoors() {
    $('.leftDoor, .leftDoorGlass').css('animation','openLeft 5s ease-in');
    $('.rightDoor, .rightDoorGlass').css('animation','openRight 5s ease-in');
    $('.pleaseWaitSign').css('animation','fall 5s ease-in');
    setTimeout(function() {$('.glassDoors').empty()}, 4500)
}
/**
 * Function to rotate gallery down from top of cube
 * @Param none
 */
function rotateDown() {
    $('.nextPainting, .previousPainting, .rotateTop, .rotateDown').removeClass('clickable').off(); //remove click handlers
    var currentRotation = $('.gallery_column').attr('rotation'); //set cube to face current face prior to looking at top of cube
    $('.rotateDown').css('bottom', '-10vmin'); //put top button in view
    $('.rotateTop').css('top', '-2vmin'); //remove bottom button from view
    $('.gallery_column').css('transform','translate3d(-49vmin, 0, -49vmin) rotateY(' + currentRotation + 'deg)'); //retrun cube to prior face before looking at top
    setTimeout(function() { //reapply click handlers
        $('.nextPainting').addClass('clickable').on("click", nextPainting);
        if (currentPainting > 0) {
            $('.previousPainting').addClass('clickable').on("click", previousPainting);
        }
        $('.rotateTop').addClass('clickable').on("click", rotateTop);
        $('.rotateDown').addClass('clickable').on("click", rotateDown);
    }, 2000)
}
/**
 * Function to display Modal when clicking Painting
 * @Param none
 */
function displayModal() {
    var $myModal = $("#myModal");
    var url = $("."+arguments[0].currentTarget.parentNode.parentNode.className+" ."+arguments[0].currentTarget.className+" .modalTarget").attr("style"); //find url of nested image in target element
    var firstSubstringIndex = url.indexOf("(")+2; //find ( in url
    var lastSubstringIndex = url.indexOf(")")-1; //find ) in url
    console.log(url.substring(firstSubstringIndex, lastSubstringIndex)); //remove url in parentheses, accounting for quotations marks inside parentheses
    $(".modal-content").attr("src", url.substring(firstSubstringIndex, lastSubstringIndex)); //set modal image to url of target
    $myModal.css("display", "block"); //display modal
    $myModal.on("click", function(){ //on click, remove modal and click handler from modal
        $myModal.css("display", "none");
        $myModal.off();
    })
}
/**
 * Function to handle all actions that will occur on page load
 * @Param none
 */
$(document).ready(function() {
    allPaintings[0].populatePage(2); //put splash page on face 2
    $('.rotateTop').addClass('clickable').on('click', rotateTop); //apply click handler to rotate top button
    $('.rotateDown').addClass('clickable').on('click', rotateDown); //apply click handler to rotate bottom button
    getAPIKey().then((response)=>{
            API_Key = response.token
            for(var i = 0; i < 10; i++) { //create ten paintings on load
                getNewPainting();
            }
        }, errorFunction)
    var timer = setInterval(function(){ //populate faces once at least 5 paintings have been created
        if(completedPaintings > 4){
            openGalleryDoors();
            allPaintings[1].populatePage(3);
            allPaintings[2].populatePage(4);
            $(".nextPainting").addClass('clickable').on("click", nextPainting); //apply click handler for next painting button
            $(".painting_container_div").on("click", displayModal);
            $(".artist_container_div").on("click", displayModal);
            clearInterval(timer);
        }
    },5000);
    $(".previousPainting").on("click", previousPainting); //apply click handler for previous painting button
});