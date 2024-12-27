autowatch = 1;
outlets = 2;

function asciiToNumbers() {
    // Step 1: Convert the ASCII values to a string
    var string = '';
    for (var i = 0; i < arguments.length; i++) {
        post("arg: ",arguments[i],"\n")
        string += String.fromCharCode(arguments[i]);
    }
    
    // Step 2: Split the string into individual numeric components
    var parts = string.split(' ');
    var numberArray = [];
    for (var j = 0; j < parts.length; j++) {
        numberArray.push(parseInt(parts[j], 10));
    }
    
    outlet(0,numberArray) ;
}

function parseAsciiMessage() {
    var string = '';
    
    // Step 1: Convert ASCII values to a string
    for (var i = 0; i < arguments.length; i++) {
        string += String.fromCharCode(arguments[i]);
    }
    //post("string: ",string,"\n")
    // Step 2: Split the string into parts by spaces
    var parts = string.split(' ');
    
    // Step 3: Extract the first part as the command (string) and the rest as numbers
    var result = [];
    result.push(parts[0]);  // First part is the string (e.g., "/sensors")
    //post("first output: ",result,"\n")
    for (i = 1; i < parts.length; i++) {
        var number = parseInt(parts[i], 10);
        if (!isNaN(number)) {
            result.push(number);  // Convert and add numbers
        }
    }
    
    outlet(1,result.length);
    for (i = 0; i < result.length; i++) {
        outlet(0,result[i]);
    }
}
