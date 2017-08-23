/**
 * Global Variable to store all previously generated Painting Objects
 * @Global {Array} of {Objects}
 */
var allPaintings = [];

/**
 * Global Variable to store completed AJAX calls in chain
 * @Global {Number}
 */
var countAjax = 0;

/**
 * Global Variable to store number of paintings to be made currently
 * @Global {Number}
 */

var paintingsRequested = 4;

/**
 * AJAX call to Artsy to receive random artwork with information
 * @param {string} "sample" and requires XAPP token
 * @return {JSON} Paiting image, painting title, painting ID, and gallery name (with conditional to check if empty)
 */
function getNewPainting(){
    $.ajax({ //Random artwork lookup
        url: "https://api.artsy.net/api/artworks?sample",
        method: "GET",
        dataType: "json",
        headers: {
            "X-Xapp-Token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsImV4cCI6MTUwMzk0NzkxNiwiaWF0IjoxNTAzMzQzMTE2LCJhdWQiOiI1OTliMzIwYzljMThkYjZmNzlkN2ViNmYiLCJpc3MiOiJHcmF2aXR5IiwianRpIjoiNTk5YjMyMGNhMDlhNjcxN2RhYjdiZmIyIn0.kN3DSO2Ppf1o6kbAJ6lkQw_TCSCxIAoWxjc9en2WXNE",
        },
        success: startAjaxBranches,
        error: errorFunction
    });
}

/*
 * Function to take in response from initial painting creation call and check for presence of gallery, then start two branching AJAX chains with response as an argument.
 * @param {response}
 * @return {undefined}
 */
function startAjaxBranches (response) {
    if (response.collecting_institution === "") {
        return getNewPainting();
    }
    var painting = new Painting();
    allPaintings.push(painting);
    countAjax++;
    getPaintingArtist(response);
    getGalleryLocation(response);
}

/**
 * AJAX call to Artsy to recieve Artist name and portrait from the painting ID
 * @param {string} painting ID and XAPP token
 * @return {JSON} Artist name and artist image
 */
function getPaintingArtist(response) {
    allPaintings[allPaintings.length - 1].paintingID = response.id;
    allPaintings[allPaintings.length - 1].paintingTitle = response.title;
    allPaintings[allPaintings.length - 1].paintingImage = allPaintings[allPaintings.length - 1].setPaintingSize(response._links.image.href, "large");
    $.ajax({  //Artist Lookup
        url: "https://api.artsy.net/api/artists?sample",
        method: "GET",
        dataType: "json",
        data: {
            "artwork_id": response.id
        },
        headers: {
            "X-Xapp-Token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsImV4cCI6MTUwMzk0NzkxNiwiaWF0IjoxNTAzMzQzMTE2LCJhdWQiOiI1OTliMzIwYzljMThkYjZmNzlkN2ViNmYiLCJpc3MiOiJHcmF2aXR5IiwianRpIjoiNTk5YjMyMGNhMDlhNjcxN2RhYjdiZmIyIn0.kN3DSO2Ppf1o6kbAJ6lkQw_TCSCxIAoWxjc9en2WXNE",
        },
        success: getArtistBio,
        error: errorFunction
    });
}

/**
 * AJAX call to Google Geocoding to show the location of the home gallery
 * @param {string} Home gallery name
 * @return {number} Latitude and Longitude of the gallery
 */
function getGalleryLocation(response) {
    allPaintings[allPaintings.length - 1].paintingGallery = response.collecting_institution;
    $.ajax({ //Geocoding API
        url: "https://maps.googleapis.com/maps/api/geocode/json",
        method: "GET",
        dataType: "json",
        data: {
            address: allPaintings[allPaintings.length - 1].replaceXwithY(allPaintings[allPaintings.length - 1].paintingGallery, " ", "+"),
            key: "AIzaSyAaECqfgaoi_qM2RBsq8VYAuuFevWg3bhg"
        },
        success: getGalleryMap,
        error: errorFunction
    });
}

/**
 * AJAX call to Google Maps to display a map of the painting's housing gallery
 * @param {number} Latitude and Longitude of the housing gallery
 * @return {jQuery Object} jQuery wrapped DOM element to add to container div
 */
function getGalleryMap(response){
    countAjax++;
    allPaintings[allPaintings.length - 1].galleryCoordinates.latitude = response.results[0].geometry.location.lat;
    allPaintings[allPaintings.length - 1].galleryCoordinates.longitude = response.results[0].geometry.location.lng;
    var urlStr = "https://www.google.com/maps/embed/v1/view?key=AIzaSyDWPRK37JSNxBhmLhEbWzCQ57MQBQu8atk&center=" + allPaintings[allPaintings.length - 1].galleryCoordinates.latitude + "," + allPaintings[allPaintings.length - 1].galleryCoordinates.longitude + "&zoom=18&maptype=satellite";
    var iframeElement = $('<iframe>',{
        frameborder: "0",
        style: "border:0",
        src: urlStr
    });
    iframeElement.css({"width":"100%", "height":"100%"});
    allPaintings[allPaintings.length - 1].paintingMap = iframeElement;
    checkForAjaxCompletion();
}


/**
 * AJAX call
 * @param {string} Artist's name
 * @return {JSON} Artist's short biography from Wikipedia
 */
function getArtistBio(response) {
    countAjax++;
    allPaintings[allPaintings.length - 1].artistImage = allPaintings[allPaintings.length - 1].setPaintingSize(response._links.image.href, "square");
    allPaintings[allPaintings.length - 1].artistName = response.name;
    $.ajax({ //get first passage of Wikipedia of Artist
        url: "https://en.wikipedia.org/w/api.php",
        method: "GET",
        dataType: "jsonp",
        data: {
            action: "query",
            titles: allPaintings[allPaintings.length - 1].artistName,
            format: "json",
            prop: "extracts",
            exintro: true,
            explaintext: true
        },
        success: successArtistBio,
        error: errorFunction
    });
}

function successArtistBio (response) {
    var pageKey = Object.keys(response.query.pages);
    allPaintings[allPaintings.length - 1].artistBiography = response.query.pages[pageKey[0]].extract;
    checkForAjaxCompletion();
}

function checkForAjaxCompletion () {
    countAjax++;
    if(countAjax === 5) {
        countAjax = 0;
        paintingsRequested--;
        console.log(allPaintings[allPaintings.length-1]);
        if(paintingsRequested > 0) {
            getNewPainting();
        }
    }
}

function errorFunction(){
    console.log("whoops");
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
     */
    this.populatePage = function() {
        this.createImageDOM(this.paintingImage, '.painting_image_div');
        this.createImageDOM(this.artistImage, '.artist_image_div');
        $(".artistName").text(this.artistName);
        $(".artistBio").text(this.artistBiography).scrollTop(0);
        $(".map_image_div").append(this.paintingMap);
    };
    /*
     * Method to take in a string and return it with all instances of "x" replaced with "y"
     * @param {string, string, string}
     * @return {string}
     */
    this.replaceXwithY = function(string, x, y) {
        return string.split(x).join(y);
    };

    /*
     * Method to take in a url in string format and return it with default image_version placeholder replaced with desired image size
     * @param {string, string}
     * @return {string}
     */
    this.setPaintingSize = function(url, size) {
        return url.replace("{image_version}", size)
    }
}

function rotateGalleryRight() {
    $('.gallery_wall_1, .gallery_wall_1 > .gallery_container_div').css({
        'transform':'rotateY(0deg)'
    });
    $('.gallery_wall_2').css({
        'transform-origin':'right',
        'transform':'rotateY(90deg)'
    })
}


$(document).ready(function() {
    $('.generateNewPainting').on('click', getNewPainting);
    getNewPainting();
    // var timer = setInterval(function(){
    //     if(allPaintings.length > 2) {
    //         $("#nextPainting").on("click", nextPainting);
    //         clearInterval(timer);
    //     }
    // },250);
    // $("#previousPainting").on("click", previousPainting);
});