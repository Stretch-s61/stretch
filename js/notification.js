// Queries for the noficiation html page.

// 5,242,880 bytes max. currently ~1 mil. hopefully will not need to configure 
// a new storage system. (clear storage every time a new dataset is queried?)
chrome.storage.local.getBytesInUse(null, function(bytes) {
    console.log(bytes); 
});

// check how long ago the exercises were saved, if they were saved more than
// 1 month ago then re-get them and store them locally.
chrome.storage.local.get('exercisesLastSaved', function(date) {
    console.log("Querying exercisesLastSaved for date " + date.exercisesLastSaved);
    if (date.exercisesLastSaved == null) { queryAllAPIs(); }
    else {
        var currentDate = new Date();
        var currentDate_ms = currentDate.getTime();
        if ((currentDate_ms - date) > (30 * 1000 * 60 * 60 * 24)) { queryAllAPIs(); }
    }
    grabAndDisplayExercise();
});

function queryAllAPIs() {
    queryAPI(2056805, "elbowwrist");
    queryAPI(2056807, "lowerbackcore");
    queryAPI(2056810, "knee");
}

// if the exercise is too old, re-get from website and save to storage.
function queryAPI(workoutID, workoutType){ 
    var exercises;
    var xhr = new XMLHttpRequest();
    var URL = "https://physera.com/api/workout/" + workoutID;
    xhr.open("GET", URL, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            exercises = JSON.parse(xhr.responseText); // get the exercises
            
            var d = new Date(); // save the date we got this exercise
            chrome.storage.local.set({'exercisesLastSaved': d.getTime()}, function() {
                console.log("Current date " + d.getTime() + " saved as exercisesLastSaved.");
            });

            // save the results
            if (workoutType == "elbowwrist") {
                chrome.storage.local.set({"elbowwristresults": exercises}, function() {
                  console.log("Saved " + workoutType + " results.");
                  console.log(exercises.exercises);
                  if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    return;
                  }
                });
            } else if (workoutType == "lowerbackcore") {
                chrome.storage.local.set({"lowerbackcoreresults": exercises}, function() {
                  console.log("Saved " + workoutType + " results.");
                  console.log(exercises.exercises);
                  if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    return;
                  }
                });
            } else if (workoutType == "knee") {
                chrome.storage.local.set({"kneeresults": exercises}, function() {
                  console.log("Saved " + workoutType + " results.");
                  console.log(exercises.exercises);
                  if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    return;
                  }
                });
            }
            
        } // end if readystate = 4 statement
    } // end xhr on ready state change function
    xhr.send();  
} 

function grabAndDisplayExercise() {
    console.log("Displaying Exercse");
    var results;
    chrome.storage.local.get('type', function(data) {
        var type;
        if (data == null) { type = "elbowwrist"; }
        else { type = data.type; }
        if (type == "elbowwrist") {
            chrome.storage.local.get("elbowwristresults", function(data) {
                console.log(data);
                results = data.elbowwristresults.exercises;
                pickRandomExercise(results);
            });
        } else if (type == "lowerbackcore") {
            chrome.storage.local.get("lowerbackcoreresults", function(data) {
                console.log(data);
                results = data.lowerbackcoreresults.exercises;
                pickRandomExercise(results);
            });
        } else if (type == "knee") {
            chrome.storage.local.get("kneeresults", function(data) {
                console.log(data);
                results = data.kneeresults.exercises;
                pickRandomExercise(results);
            });
        }
        
    });
    
}

// picks a random exercise, displays if it's valid
function pickRandomExercise(exercises){
    var exerciseKeys = Object.keys(exercises);
    var randomKey = exerciseKeys[Math.floor(Math.random() * exerciseKeys.length)];
    var selectedExercise = exercises[randomKey].exercise;
    console.log(selectedExercise);
    
    var valid = ! selectedExercise.display_name.includes("DELETE");

    // CHECK IF THE EXERCISE IS VALID
    if (valid) {
        displayExercise(selectedExercise);
    } else { 
        pickRandomExercise(exercises);
    }
}

// javascript to append to the html page to display an exercise, precondition it is valid
function displayExercise(selectedExercise) {
    var htmlText = '';

    var displayName = document.createElement('h2');
    displayName.innerHTML = selectedExercise.display_name;
    document.getElementById('content').append(displayName);

    var rc = selectedExercise.data.rep_count;
    var rt = selectedExercise.data.rep_time;

    if (rc != null & rt != null) {
        var repetitions = document.createElement('p');
        var repString = "Repetitions: " + rc;
        if (rc > 1) {
            repString += " repetition(s), one every " + rt + " seconds.";
        }
        else if (rc = 1) {
            repString += " repetition for " + rt + " seconds.";
        }
        repetitions.innerHTML = repString;
        document.getElementById('content').append(repetitions);
    }

    var br = document.createElement('br');
    document.getElementById('content').appendChild(br);
    
    var inst = selectedExercise.data.instructions;

    var instructions = document.createElement('p');
    instructions.className = "limitWidth";
    instructions.innerHTML = "Instructions: \n";
    document.getElementById('content').append(instructions);

    for (i in inst) {
        var instruction = document.createElement('p');
        var index = Number(i) + 1;
        instruction.innerHTML = index + '. ' + inst[i].text;
        document.getElementById('content').append(instruction);
    }

    // add the images
    var imageURL = selectedExercise.images[0].urls.original;

    var image = document.createElement('img');
    image.src = imageURL;
    image.setAttribute("class", "img-responsive");
    image.setAttribute("max-width", "100%");
    image.setAttribute("height", "auto");
    
    document.getElementById('image').append(image);
}