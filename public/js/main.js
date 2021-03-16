'use strict';
(function() {
  var user = {};
  var userlocationMarker = {};
  var mymap = {};
  var imageEditing = {};
  var currentMarker = -1;
  const URL = "https://www.lmh98.com/api";

  window.addEventListener("load", init);
  let colors = chroma.scale('YlOrRd').colors(5);
  function init() {
    fetch(URL + "/aed")
      .then(checkStatus)
      .then(resp => resp.json())
      .then(loadMap)
      .catch(handleError);
    let boxBtn = document.getElementById("find-aed");
    boxBtn.addEventListener("click", findAED);
    let userLocation =  document.getElementById("user-location");
    userLocation.addEventListener('click', ()=>window.navigator.geolocation.getCurrentPosition(findUserLocation, handleError));
    let loginBtn = document.getElementById("login-btn");
    loginBtn.addEventListener('click', login);
    let changePasswordBtn = document.getElementById("change-password-btn");
    changePasswordBtn.addEventListener('click', changePassword);
    let viewUploadedHisBtn = document.getElementById("view-upload-history");
    viewUploadedHisBtn.addEventListener('click', loadUserHistory);
    let userInfoBtn = document.getElementById("signed-in");
    userInfoBtn.addEventListener('click', ()=>{
      document.getElementById("user-info-id").textContent = user;
      document.getElementById("user-info").classList.remove("hidden");
      document.getElementById("main").classList.add("freeze");
    });
    let uploadBtn = document.getElementById("upload");
    uploadBtn.addEventListener('click', (e)=> {
        document.getElementById("marker-info-container").classList.add("hidden");
        document.getElementById("upload-img").classList.remove('hidden');
        document.getElementById("main").classList.add("freeze");
        document.getElementById('select-img-btn').value = '';
        currentMarker = item.id;
        imageEditing.bind({url: "img/upload.jpg"});
    });
    let logOutBtn = document.getElementById("log-out");
    logOutBtn.addEventListener('click', ()=>{
      document.getElementById("unsigned").classList.remove("hidden");
      document.getElementById("signed-in").classList.add("hidden");
      document.getElementById("signed-in-p").textContent = "";
      document.getElementById("user-info-id").textContent = "";
      document.getElementById("user-info").classList.add("hidden");
      document.getElementById("main").classList.remove("freeze");
      document.getElementById("user-uploaded-container").innerHTML = "";
      user = {};
      userlocationMarker = {};
    });

    let createAccountBtn = document.getElementById("create-account-btn");
    createAccountBtn.addEventListener('click', createAccount);
    let el = document.getElementById('image-cutting');
    imageEditing = new Croppie(el, {
        viewport: { width: 400, height: 300 },
        boundary: { width: 440, height: 330 },
        showZoomer: true,
        enableOrientation: true
    });
    let fileInput = document.getElementById('select-img-btn');
    fileInput.addEventListener('change',displayImg);
    let submitBtn = document.getElementById("submit");
    submitBtn.addEventListener('click', submitImage);
  }

  async function loadUserHistory() {
    document.getElementById("user-info").classList.add("hidden");
    document.getElementById("user-uploaded-img").classList.remove("hidden");
    document.getElementById("main").classList.add("freeze");
    let result = {};
    try {
      let params = new FormData();
      params.append("email", user);
      let response = await fetch(URL + "/user-upload", {method : "POST", body : params});
      checkStatus(response);
      result = await response.json();
    } catch (error) {
      handleError();
    }
    let container = document.getElementById("user-uploaded-container");
    container.innerHTML = "";
    result.img.rows.forEach((item) => {
      let proving = "Pending";
      if (item.rank != -1) {
        proving = "Proved"
      }
      let divRow = document.createElement("div");
      divRow.classList.add("info-element");
      divRow.classList.add("shadow-sm");
      divRow.classList.add("flex-column");
      let firstRow = document.createElement("div");
      let name = document.createElement("p");
      //name.setAttribute('href', URL + '/pic/' + item.img_id);
      name.textContent = "ID: " + item.img_id + "   ||   Status: " + proving;

      let date = document.createElement("p");
      date.textContent = "Upload Date: " + ("" + item.upload_date.substring(0, 10));
      let description = document.createElement("p");
      description.textContent = "Description: " + item.description;
      divRow.appendChild(name);
      divRow.appendChild(date);
      divRow.appendChild(description);
      divRow.addEventListener('click', ()=> window.open(URL + '/pic/' + item.img_id));
      container.appendChild(divRow);
    });
  }

  function changePassword() {
    let oldPassword = document.getElementById("change-password-old").value;
    document.getElementById("change-password-old").value = "";
    let newPassword = document.getElementById("change-password-new").value;
    document.getElementById("change-password-new").value = "";
    let confirmPassword = document.getElementById("change-password-confirm").value;
    document.getElementById("change-password-confirm").value = "";
    if (newPassword === confirmPassword && newPassword.length > 5 && newPassword.length < 20) {
      let params = new FormData();
      params.append("email", user);
      params.append("oldPassword", oldPassword);
      params.append("newPassword", newPassword);
      params.append("confirmPassword", confirmPassword);
      console.log(user);
      fetch(URL + "/change-password", {method : "POST", body : params })
        .then(checkStatus)
        .then(resp => resp.json())
        .then(switchUserInterface)
        .catch(handleError);
    } else if (password !== confirmPassword) {
      window.alert("password doesn't match");
    } else if (password.length >= 20){
      window.alert("password is too long, exceed 20 chars");
    } else {
      window.alert("password is too short, below 6 chars");
    }
  }

  /**
  * sumbit the cutted image to server
  */
  function submitImage() {
    if(Object.keys(user).length !== 0 && currentMarker !== -1){
      imageEditing.result({type: "canvas", size: "original", format: "jpg", quality: 1}).then((img)=>{
        let params = new FormData();
        params.append("aed_id", currentMarker);
        params.append("email", user);
        params.append("description", document.getElementById("description").value);
        params.append("image", img);
        fetch(URL + "/upload",  {method : "POST", body : params })
          .then(checkStatus)
          .then(resp => resp.json())
          .then(imageUploaded)
          .catch(handleError);
      });
    }
  }

  /**
  * display the user select image in the image cutting region
  */
  function displayImg() {
    document.getElementById("select-img-btn").classList.add("hidden");
    let input = document.getElementById('select-img-btn');
    if (input.files && input.files[0]) {
      let reader = new FileReader();
      reader.onload = function (e) {
        imageEditing.bind({url: e.target.result})
        .then(function(){
          let uploadBtn = document.getElementById("submit");
          uploadBtn.textContent = "Upload";
          uploadBtn.classList.remove('freeze');
          uploadBtn.classList.remove("btn-outline-secondary");
          uploadBtn.classList.add("btn-outline-success");
      	});
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  /**
  * handle ui after fetch the server with img from submitImage
  */
  function imageUploaded(json) {
    if(json.status == true) {
      document.getElementById("upload-img").classList.add("hidden");
      document.getElementById("success-m").innerHTML = json.info;
      document.getElementById("success-m").classList.remove('hidden');
      setTimeout(() => {
        document.getElementById("success-m").classList.add('hidden');
        document.getElementById("main").classList.remove("freeze");
      }, 1700);
    } else {
      let errorMessasge = document.getElementById("error-m");
      errorMessasge.innerHTML = json.info;
      errorMessasge.classList.remove('hidden');
      document.getElementById("image-cutting").classList.add('freeze');
      setTimeout(() => {
        document.getElementById("image-cutting").classList.remove('freeze');
        document.getElementById("error-m").classList.add('hidden');
      }, 1700);
    }
  }

  function createAccount() {
    let email = document.getElementById("create-account-email").value;
    let password = document.getElementById("create-account-password").value;
    let confirmPassword = document.getElementById("create-account-password-confirm").value;
    document.getElementById("create-account-email").value = "";
    document.getElementById("create-account-password").value = "";
    document.getElementById("create-account-password-confirm").value = "";
    if (validateEmail(email) && password === confirmPassword && password.length > 5 && password.length < 20) {
      let params = new FormData();
      params.append("email", email);
      params.append("password", password);
      params.append("confirmPassword", confirmPassword);
      fetch(URL + "/registor", {method : "POST", body : params })
        .then(checkStatus)
        .then(resp => resp.json())
        .then(switchUserInterface)
        .catch(handleError);
    } else if (password !== confirmPassword) {
      window.alert("password doesn't match");
    } else if (password.length >= 20){
      window.alert("password is too long, exceed 20 chars");
    } else {
      window.alert("password is too short, below 6 chars");
    }
  }

  function login() {
    let email = document.getElementById("login-email").value;
    let password = document.getElementById("login-password").value;
    document.getElementById("login-password").value = "";
    document.getElementById("login-email").value = "";
    if (validateEmail(email) && password.length > 5 && password.length < 20) {
      let params = new FormData();
      params.append("email", email);
      params.append("password", password);

      fetch(URL + "/login", {method : "POST", body : params })
        .then(checkStatus)
        .then(resp => resp.json())
        .then(switchUserInterface)
        .catch(handleError);

    } else if (password.length >= 20){
      window.alert("password is too long, exceed 20 chars");
    } else {
      window.alert("password is too short, below 6 chars");
    }
  }


  /**
   * when login is successed, switch to user own interface
   */
  function switchUserInterface(json) {
    if(json.status == true) {
      user = json.name;
      document.getElementById("change-password").classList.add("hidden");
      document.getElementById("create-account").classList.add("hidden");
      document.getElementById("login").classList.add("hidden");
      document.getElementById("unsigned").classList.add("hidden");
      document.getElementById("signed-in").classList.remove("hidden");
      document.getElementById("signed-in-p").textContent = json.name;
      document.getElementById("success-m").innerHTML = json.info;
      document.getElementById("success-m").classList.remove('hidden');
      setTimeout(() => {
        document.getElementById("success-m").classList.add('hidden');
        document.getElementById("main").classList.remove("freeze");
      }, 1700);

    } else {
      let errorMessasge = document.getElementById("error-m");
      errorMessasge.innerHTML = json.info;
      errorMessasge.classList.remove('hidden');
      document.getElementById("login").classList.add('freeze');
      document.getElementById("create-account").classList.add('freeze');
      document.getElementById("change-password").classList.add("freeze");
      setTimeout(() => {
        document.getElementById("change-password").classList.remove("freeze");
        document.getElementById("login").classList.remove('freeze');
        document.getElementById("create-account").classList.remove('freeze');
        document.getElementById("error-m").classList.add('hidden');
      }, 1700);
    }
  }

  function validateEmail(email) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
      return (true);
    }
    window.alert("You have entered an invalid email address!");
    return (false);
  }

  /**
   * this function would find user current location and update the userlocationMarker
   * @param {object} pos contain the user location info from window.navigator.geolocation
   */
  function findUserLocation(pos) {
    let crd = pos.coords;
    mymap.removeLayer(userlocationMarker);
    userlocationMarker = L.marker(new L.LatLng(crd.latitude, crd.longitude));
    mymap.addLayer(userlocationMarker);
    mymap.setView([crd.latitude, crd.longitude], 14);
  }

  //this function would send a get request to server to find the closet AED
  async function findAED() {
    if (Object.keys(userlocationMarker).length === 0) {
      window.alert("Please Click the Map to Indicate Your Location");

    } else {
      let info = document.getElementById("info");
      info.classList.remove("hidden");
      let lat = userlocationMarker._latlng.lat;
      let lng = userlocationMarker._latlng.lng;
      let result = {}
      try {
        let response = await fetch(URL + "/loc/" + lat + "/" + lng);
        checkStatus(response);
        result = await response.json();
      } catch (error) {
        handleError();
      }
      let container = document.getElementById("info-content");
      container.innerHTML = "";
      result.aeds.rows.forEach((item) => {
        let divRow = document.createElement("div");
        divRow.lat = item.aed_latitude;
        divRow.lng = item.aed_longitude;
        divRow.addEventListener('click', (evt) => {mymap.setView([evt.currentTarget.lat, evt.currentTarget.lng],
                                                                      18, {animate: true,duration: 0.5});});
        divRow.classList.add("info-element");
        divRow.classList.add("shadow-sm");
        let div = document.createElement("div");
        let name = document.createElement("p");
        name.textContent = item.aed_location_name;
        let dist = document.createElement("p");
        dist.textContent = "Linear Distance: " + Math.round(parseFloat(item.dist)) + "m || " +  Math.round( parseFloat(item.dist) / 3.28084 ) + "ft";
        let access = document.createElement("p");
        access.textContent = "Access Ability: " + item.aed_accessibility;
        div.appendChild(name);
        div.appendChild(dist);
        div.appendChild(access);
        divRow.appendChild(div);

        let colorName = "map-icon-yellow";
        let icon = document.createElement("i");
        icon.classList.add("fa");
        icon.classList.add("fa-heartbeat");
        icon.classList.add("info-element-icon");
        if (item.image_approved === "Yes") {
          icon.classList.add("map-icon-green");
        } else {
          icon.classList.add("map-icon-yellow");
        }
        divRow.append(icon);
        container.append(divRow);
      });
    }
  }

  /**
   * handle error, display error in window alert
   * @param {message} message contain the error response from server
   */
  function handleError(message) {
    window.alert(message)
  }

  /**
   * response ok or not ok situation.
   * @param {response} response contain the response from server
   * @return {response} response contain the response from server
   */
  function checkStatus(response) {
    if (response.ok) {
      return response;
    }
    console.log(response);
    throw Error("Error in request: " + response.statusText);
  }

  /**
   * initiallize and load aeds in map.
   * @param {json} allAed contain all AEDs info from server in json formate
   */
  function loadMap(allAed) {
    mymap = L.map("map", {
        center: [47.6062, -122.3321],
        zoom: 12,
        maxZoom: 18,
        minZoom: 12,
        detectRetina: true // detect whether the sceen is high resolution or not.
    });
    L.control.scale({position: 'bottomleft'}).addTo(mymap);
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(mymap);
    mymap.attributionControl.addAttribution('Licensed by &copy; <a href="some_link", class="your_class">Minghao Liu || Zejun Zheng</a>   ');
    let markers = L.markerClusterGroup({
      iconCreateFunction: function(cluster) {
        if (cluster.getChildCount() >= 500){
            return L.divIcon({html: '<i class="fa fa-medkit map-icon-red" style="font-size:70px"></i>'});
        } else if (cluster.getChildCount() >= 100) {
            return L.divIcon({html: '<i class="fa fa-medkit map-icon-red" style="font-size:50px"></i>'});
        } else {
            return L.divIcon({html: '<i class="fa fa-medkit map-icon-red" style="font-size:30px"></i>'});
        }
      },
	     showCoverageOnHover: false,
    });
    allAed.aeds.rows.forEach((item, i) => {
      if (item.aed_longitude && item.aed_latitude) {
        let colorName = "map-icon-yellow"
        if (item.image_approved === "Yes") {
          colorName = "map-icon-green"
        }
        let marker = L.marker(new L.LatLng(item.aed_latitude, item.aed_longitude), {icon: L.divIcon({className: 'fa fa-heartbeat ' + colorName})});
        marker.item = item;
        marker.addEventListener("click", aedPopup);
  			markers.addLayer(marker);
      }
    });
		mymap.addLayer(markers);
    let legend = L.control({position: 'topright'});
    legend.onAdd = function () {
      let div = L.DomUtil.create('div', 'legend');
      div.innerHTML += '<b>AED Approval<b>';
      div.innerHTML += '<i class="fa fa-heartbeat map-icon-yellow"></i><p>Not Yet</p>';
      div.innerHTML += '<i class="fa fa-heartbeat map-icon-green"></i><p>Approved</p>';
      return div;
    };
    legend.addTo(mymap);
    mymap.on('click', onMapClick);
    function onMapClick(e) {
      mymap.removeLayer(userlocationMarker);
      userlocationMarker = L.marker(e.latlng);
      mymap.addLayer(userlocationMarker);
    }
  }

  /**
   * add picture and aed's info into a popup
   * @param {object} e contain the marker object which user clicked.
   */
  function aedPopup(e) {
    let item = e.sourceTarget.item;
    document.getElementById("marker-info-container").classList.remove("hidden");
    document.getElementById("main").classList.add("freeze");
    let container = document.getElementById("marker-info");
    container.innerHTML = "";
    let name = document.createElement('h4');
    name.textContent = replaceNullWithUnkown(item.aed_location_name);
    let address = document.createElement('p');
    address.textContent = "Address of the AED: " + replaceNullWithUnkown(item.aed_address);
    let descrip = document.createElement('p');
    descrip.textContent = "Description of the AED: " + replaceNullWithUnkown(item.aed_location_description);
    let info = document.createElement('p');
    info.textContent = "Image Approved: " + replaceNullWithUnkown(item.image_approved)
              + "  ||  AED Accessibility: " + replaceNullWithUnkown(item.aed_accessibility);
    container.appendChild(name);
    container.appendChild(address);
    container.appendChild(descrip);
    container.appendChild(info);
    let img = document.getElementById("marker-img");
    img.src = URL + "/aed/" + item.id;
    let uploadBtn = document.getElementById("upload");
    if (Object.keys(user).length !== 0) {
      uploadBtn.textContent = "Upload AED Picture";
      uploadBtn.classList.remove('freeze');
      uploadBtn.classList.remove("btn-outline-secondary");
      uploadBtn.classList.add("btn-outline-success");
      uploadBtn.itemId = item.id;
    } else {
      uploadBtn.textContent = "Please Login To Upload Image";
      uploadBtn.classList.add('freeze');
      uploadBtn.classList.remove("btn-outline-success");
      uploadBtn.classList.add("btn-outline-secondary");
    }
  }

  /**
   * @param {string} text contain the string from server response.
   * @return {string} return either UNKNOWN if text is null or origional text
   */
  function replaceNullWithUnkown(text) {
    if(text) {
      return text;
    }
    return "UNKNOWN"
  }

})();

function returnToMainFromUserInfo() {
  document.getElementById("user-info").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

function returnToMainFromChangePassword() {
  document.getElementById("change-password").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

function returnToMainFromUpload() {
  document.getElementById("upload-img").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
  document.getElementById("select-img-btn").classList.remove("hidden");
}

//add hidden to the info div which contains closet AED location
function returnToMainFromInfo() {
  document.getElementById("info").classList.add("hidden");
}

function returnToMainFromUserUploaded() {
  document.getElementById("user-uploaded-img").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

function returnToMainFromMarkerInfo() {
  document.getElementById("marker-info-container").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

function returnToMainFromCreateAccount() {
  document.getElementById("create-account").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

//add hidden to the user interaction div on both login and creat user div
function returnToMainFromLogin() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("main").classList.remove("freeze");
}

//remove hidden from change Password div
function clickChangePassword() {
  document.getElementById("user-info").classList.add("hidden");
  document.getElementById("change-password").classList.remove("hidden");
  document.getElementById("main").classList.add("freeze");
}

//remove hidden from the createUser div
function clickCreateUser(){
  document.getElementById("create-account").classList.remove("hidden");
  document.getElementById("main").classList.add("freeze");
}

//remove hidden from the user login div
function clickLogin(){
  document.getElementById("login").classList.remove("hidden")
  document.getElementById("main").classList.add("freeze");
}
