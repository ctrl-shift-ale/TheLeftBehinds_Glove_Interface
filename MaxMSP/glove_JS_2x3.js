
    autowatch = 1;
    outlets = 4; // 0: real time data, 1:refresh triggers, 2:preset data, 3: print
    var DEBUGGING_DATA = true;
    var DEBUGGING_MAXOBJECTS = true;
    var DEBUGGING_SCENE = true;
    
    var NFLEX = 2;
    var FLEX_FINGERS = [1,3]; //0:thumb, 1: index, 2: middle, 3: ring
    var NFSR = 3;
    var FSR_FINGERS = [0,1,2];
    

    var OUTLET_RT_DATA = 0;
    var OUTLET_REFRESH = 1;
    var OUTLET_PRESET = 2;
    var OUTLET_PRINT = 3;

    var CLOCK_DEFAULT = 100;
    var PAR_NOID_DEFAULT = 0; 
    var PAR_MIN_DEFAULT = 0.0;
    var PAR_MAX_DEFAULT = 1.0;
    var PAR_EXP_DEFAULT = 1.0;

    var NFLEXPARS = 4; // number of Live parameter that a single flex can control
    var FLEX_SCALE_OUT = [0.0, 127.0];
    var FLEXOS_CURVE_EXP = 4;
    var FLEX_MUTE_DEFAULT = 0;
    var FLEX_ENV_DEFAULT = [0, FLEX_SCALE_OUT[0], 1, FLEX_SCALE_OUT[1]];

    var NFSRPARS = 4; // number of Live parameter that a single fsr can control
    var NFSRNOTEOUTS = 4; // number of Midi note on/ff that a single fsr can play at once
    var FSR_MUTE_DEFAULT = 0;
    var FSR_GATE_DEFAULT = 0;
    var FSR_NOTEOUT_DEFAULT = -1;


    var dictPresets = new Dict("glove_presets");
    var dictEnvs = new Dict("glove_envs");
    var dictHistory = new Dict("history");
    var keyClock = "::clock";
    var keyFlex_n = "::flex::"
    var keyFlexEnv = "::env";
    var keyFsrGate = "::gate";
    var keyFsrNote = "::note::";
    var keyMute = "::mute";
    var keyPar = "::par::";

    var data = []
    var dataDefaultStatus = false;
    var DATAIDX_clock = 0;
    var DATAIDX_flexs = 1;
    var DATAIDX_fsrs = 2;

    var DATAIDX_FLEX_mute = 0;
    var DATAIDX_FLEX_env = 1;
    var DATAIDX_FLEX_params = 2;

    var DATAIDX_FLEX_PAR_id = 0;
    var DATAIDX_FLEX_PAR_min = 1;
    var DATAIDX_FLEX_PAR_max = 2;
    var DATAIDX_FLEX_PAR_exp = 3;

    var DATAIDX_FSR_mute = 0;
    var DATAIDX_FSR_gate = 1;
    var DATAIDX_FSR_params = 2; 
    var DATAIDX_FSR_noteouts = 3;

    var flexosRange = [];
    var flexosValInHist = [];
    var flexosValOutHist = [];
    var newFlexoDyns = [];
    var curvedIns = [0,0,0,0];
    var flexosCurrentEnv = [];


    //MAX OBJECTS
    var MAXOBJECTS = [];
    /*
    var MAXOBJECTS = [
        "placeholder_env", //MAXOBJECTS[MAXOBJECT_CLOCK_IDX]
        [ // [MAXOBJECT_FLEXOS_IDX]
            [ //[MAXOBJECT_FLEXOS_IDX][flexIdx]
                "placeholder_mute", //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_MUTE_IDX]
                "placeholder_env", //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENV_IDX]
                "placeholder_envMenu",
                "placeholder_dot",
                "placeholder_slider_ui",
                [ //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX]
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_ID_IDX]
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //param 1
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //param 2
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //param 3
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //param 4
                    ["placeholder_paraId" , "placeholder_parMin", "placeholder_parMax","placeholder_parExp"], //param 5
                ]
            ]
        ],
        [ // [MAXOBJECT_FSR_IDX]
            [ //[MAXOBJECT_FSR_IDX][fsrIdx]
                "placeholder_mute", //[MAXOBJECT_FSR_IDX][fsrIdx][MAXOBJECT_FSR_MUTE_IDX]
                "placeholder_gate", //[MAXOBJECT_FSR_IDX][fsrIdx][MAXOBJECT_FSR_GATE_IDX]
                [ //[MAXOBJECT_FSR_IDX][fsrIdx][MAXOBJECT_FSR_PAR_IDX]
                    ["placeholder_paraId"], [parIdx][MAXOBJECT_FLEX_PAR_ID_IDX]
    ];
*/
    
    var MAXOBJECT_CLOCK_IDX = 0;
    var MAXOBJECT_FLEXOS_IDX = 1;
    var MAXOBJECT_FSRS_IDX = 2;

    var MAXOBJECT_FLEX_MUTE_MAIN_IDX = 0;
    var MAXOBJECT_FLEX_MUTE_IDX = 1; 
    var MAXOBJECT_FLEX_ENV_IDX = 2;
    var MAXOBJECT_FLEX_ENVMENU_IDX = 3;
    var MAXOBJECT_FLEX_DOT_IDX = 4; 
    var MAXOBJECT_FLEX_SLIDERUI_IDX = 5;
    var MAXOBJECT_FLEX_PAR_IDX = 6;

    var MAXOBJECT_FLEX_PAR_ID_IDX = 0;
    var MAXOBJECT_FLEX_PAR_MIN_IDX = 1;
    var MAXOBJECT_FLEX_PAR_MAX_IDX = 2;
    var MAXOBJECT_FLEX_PAR_EXP_IDX = 3;
    
    var MAXOBJECT_FSR_MUTE_MAIN_IDX = 0;
    var MAXOBJECT_FSR_MUTE_IDX = 1; 
    var MAXOBJECT_FSR_GATE_IDX = 2;
    var MAXOBJECT_FSR_PAR_IDX = 3;
    var MAXOBJECT_FSR_NOTEOUT_IDX = 4;

    var initialised = false;

// INITIALISATION FUNCTIONS
    function init_data_array() {
        data.length = 0;
        // ADD CLOCK
        data.push(CLOCK_DEFAULT); // data[CLOCK_DEFAULT]
        //data["CLOCK_DEFAULT",[["0_mute",["0_env_x.."],["0pars0"],["0pars1"]]]]
        data.push([]) //flexos  data[CLOCK_DEFAULT,[]]
        // ADD FLEXOS
        for (var i=0 ; i<NFLEX ; i++) {
            data[DATAIDX_flexs].push([]); //data[CLOCK_DEFAULT,[[]]]
            data[DATAIDX_flexs][i].push(FLEX_MUTE_DEFAULT); //data[CLOCK_DEFAULT,[ [0] ] ]
            data[DATAIDX_flexs][i].push(FLEX_ENV_DEFAULT); //data[CLOCK_DEFAULT,[ [0,[0,0,1,127]] ] ]
            data[DATAIDX_flexs][i].push([]); //data[CLOCK_DEFAULT,[[]]]
            for (var _=0 ; _<NFLEXPARS ; _++) { //data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_max]
                data[DATAIDX_flexs][i][DATAIDX_FLEX_params].push(
                    [PAR_NOID_DEFAULT,PAR_MIN_DEFAULT,PAR_MAX_DEFAULT,PAR_EXP_DEFAULT] //data[CLOCK_DEFAULT,[ [0,[0,0,1,127] , [PAR_NOID_DEFAULT,PAR_MIN_DEFAULT,PAR_MAX_DEFAULT,PAR_EXP_DEFAULT] ] ] ]
                )
            }
        }
        // ADD FSRS
        data.push([]) //fsr  data[CLOCK_DEFAULT, [flexos data] , [] ]
        for (i=0 ; i< NFSR ; i++) {
            data[DATAIDX_fsrs].push([]); //data[CLOCK_DEFAULT, [flexos data], [[]] ]
            data[DATAIDX_fsrs][i].push(FSR_MUTE_DEFAULT); //data[CLOCK_DEFAULT, [flexos data], [ [DATAIDX_FSR_mute] ] ] 
            data[DATAIDX_fsrs][i].push(FSR_GATE_DEFAULT); //data[CLOCK_DEFAULT, [flexos data], [ [DATAIDX_FSR_mute, DATAIDX_FSR_gate] ] ] 
            data[DATAIDX_fsrs][i].push([]); //data[CLOCK_DEFAULT, [flexos data], [ [DATAIDX_FSR_mute, DATAIDX_FSR_gate, DATAIDX_FLEX_params ] ] ] 
            for (_=0 ; _<NFSRPARS ; _++) {
                data[DATAIDX_fsrs][i][DATAIDX_FSR_params].push(PAR_NOID_DEFAULT);
            }
            data[DATAIDX_fsrs][i].push([]); //data[CLOCK_DEFAULT, [flexos data], [ [DATAIDX_FSR_mute, DATAIDX_FSR_gate, DATAIDX_FLEX_params, DATAIDX_FLEX_noteouts ] ] ] 
            for (_=0 ; _<NFSRNOTEOUTS ; _++) {
                data[DATAIDX_fsrs][i][DATAIDX_FSR_noteouts].push(FSR_NOTEOUT_DEFAULT); 
            }
        }
        if (DEBUGGING_DATA) {
            printData();
        }
        return true
    }

    function init_flexos_arrays() {
        flexosRange.length = 0;
        flexosValInHist.length = 0;
        flexosValOutHist.length = 0;
        flexosCurrentEnv.length = 0;
        newFlexoDyns.length = 0;
        for (var i=0 ; i<NFLEX ; i++) {
            flexosRange.push([0,8191]);
            flexosValInHist.push(0);
            flexosValOutHist.push(0);
            flexosCurrentEnv.push("none");
        }
    }

    function init_maxObj_array() {
        MAXOBJECTS.length = 0;
        MAXOBJECTS.push("placeholder_clock"); //MAXOBJECTS[MAXOBJECT_CLOCK_IDX]
        MAXOBJECTS.push([]); //MAXOBJECTS[MAXOBJECT_FLEXOS_IDX]
        for (var i=0 ; i < NFLEX; i++) {
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX].push([])
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_main_mute");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_MUTE_MAIN_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_mute");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_MUTE_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_env");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENV_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_envMenu");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENVMENU_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_dot");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_DOT_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push("placeholder_slider_ui");  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_SLIDERUI_IDX]
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i].push([]); //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX]
            for (var _=0 ; _ < NFLEXPARS; _++) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_PAR_IDX].push([
                    "placeholder_paraId" ,  //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_ID_IDX]
                    "placeholder_parMin", //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_MIN_IDX]
                    "placeholder_parMax", //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_MAX_IDX]
                    "placeholder_parExp" //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_EXP_IDX]
                ]);
            }
        }
        MAXOBJECTS.push([]); //MAXOBJECTS[MAXOBJECT_FSRS_IDX]
        for (i=0 ; i < NFSR; i++) {
            MAXOBJECTS[MAXOBJECT_FSRS_IDX].push([])
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i].push("placeholder_main_mute");  //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_MUTE_MAIN_IDX]
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i].push("placeholder_mute");  //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_MUTE_IDX]
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i].push("placeholder_gate");  //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_ENV_IDX]
           
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i].push([]); //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_PAR_IDX]
            for (var _=0 ; _ < NFSRPARS; _++) {
                MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_PAR_IDX].push("placeholder_paraId");   //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_PAR_IDX][parIdx][MAXOBJECT_FSR_PAR_ID_IDX]           
            }

            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i].push([]); //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_NOTEOUT_IDX]
            for (var _=0 ; _ < NFSRNOTEOUTS; _++) {
                MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_PAR_IDX].push("placeholder_noteOut");   //[MAXOBJECT_FSRS_IDX][fsrIdx][MAXOBJECT_FSR_PAR_IDX][parIdx][MAXOBJECT_FSR_PAR_ID_IDX]           
            }
        } 
        
    }

    function get_maxObj_names() {
        var DEBUGGING_ARRAY = [];
        var root = this.patcher; 
        // GET VARNAME OF CLOCK NUMBOX
        MAXOBJECTS[MAXOBJECT_CLOCK_IDX] = root.getnamed("clock_numbox");
        if (DEBUGGING_MAXOBJECTS) {
            post("\n GETTING NAMES OF MAX OBJECTS\n");
            if (MAXOBJECTS[MAXOBJECT_CLOCK_IDX] != "placeholder_clock") {
                post("clock box found\n")
            }
        } 
        var setup = root.getnamed("subp_setup").subpatcher();

        // GET VARNAME OF FLEX PARAM OBJECTS
        var maxObj_flexPar_prefixes = ["id" ,"min", "max", "exp"];
        for (var i=0 ; i<NFLEX; i++) { 
            DEBUGGING_ARRAY.length = 0;
            var finger = FLEX_FINGERS[i];
            if (DEBUGGING_MAXOBJECTS) {
                post("\n Objects for flex ", i, " (finger ",finger, ")\n");
            }
            var found = true;
            var objectName = "flex_mute_main_"+finger.toString();
            var object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_MUTE_MAIN_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }

            objectName = "flex_mute_"+finger.toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_MUTE_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }

            objectName = "flex_env_"+finger.toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_ENV_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }
            
            objectName = "flex_envMenu_"+finger.toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_ENVMENU_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }

            objectName = "flex_dot_"+finger.toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_DOT_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }
            
            objectName = "flex_slider_ui_"+finger.toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_SLIDERUI_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                DEBUGGING_ARRAY.push(objectName);
                found = false;
            }
            if (DEBUGGING_MAXOBJECTS) {
                if (found) {
                    post("\n OBJECTS FOUND FOR FLEX (FINGER ", finger, " )\n");
                } else {
                    post("\n OBJECTS NOT FOUND FOR FLEX (FINGER ", finger, "):\n");
                    for (j=0 ; j<DEBUGGING_ARRAY.length; j++) { 
                        post(DEBUGGING_ARRAY[j], "\n");
                    }
                }   
                
            }

            found = true;
            DEBUGGING_ARRAY.length = 0;
            if (DEBUGGING_MAXOBJECTS) {
                post("\n Parameter objects for flex ", i, " (finger ",finger, ")\n");
            }
            
            for (var j=0 ; j<NFLEXPARS ; j++) {
                for (var k=0 ; k<maxObj_flexPar_prefixes.length ; k++) {
                    objectName = varname_constructor_flexPar(finger,j,maxObj_flexPar_prefixes[k]); 
                    object = setup.getnamed(objectName); 
                    if (typeof(object == "undefined")) {
                        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_PAR_IDX][j][k] = object;
                    } else if (DEBUGGING_MAXOBJECTS) {
                        found = false;
                        DEBUGGING_ARRAY.push(objectName);
                    }
                }
            }
            if (DEBUGGING_MAXOBJECTS) {
                if (found) {
                    post("\n PARAMETER OBJECTS FOUND FOR FLEX (FINGER ", finger, " )\n");
                } else {
                    post("\n PARAMETER OBJECTS NOT FOUND FOR FLEX (FINGER ", finger, "):\n");
                    for (j=0 ; j<DEBUGGING_ARRAY.length; j++) { 
                        post(DEBUGGING_ARRAY[j], "\n");
                    }
                }
                
            }
        }

        // GET VARNAME OF FSR OBJECTS
        finger =FSR_FINGERS[i];
        found = true;
        if (DEBUGGING_MAXOBJECTS) {
            post("\n Parameter objects for fsr ", i, " (finger ",finger, ")\n");
        }
        for (i=0 ; i < NFSR; i++) {
            objectName = "fsr_mute_main_"+FSR_FINGERS[i].toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_MUTE_MAIN_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                found = false;
            }
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_MUTE_MAIN_IDX] = setup.getnamed("fsr_mute_main"+FSR_FINGERS[i].toString());
            
            objectName = "fsr_mute_"+FSR_FINGERS[i].toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_MUTE_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                found = false;
            }
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_MUTE_IDX] = setup.getnamed("fsr_mute_"+FSR_FINGERS[i].toString());
            
            objectName = "fsr_gate_slider_"+FSR_FINGERS[i].toString();
            object = setup.getnamed(objectName);
            if (typeof(object == "undefined")) {
                MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_MUTE_IDX] = object;
            } else if (DEBUGGING_MAXOBJECTS) {
                found = false;
            }
            MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_GATE_IDX] = setup.getnamed("fsr_gate_slider_"+FSR_FINGERS[i].toString());
            
            if (DEBUGGING_MAXOBJECTS) {
                if (found) {
                    post("\n OBJECTS FOUND FOR FSR (FINGER ", finger, " )\n");
                } else {
                    post("\n SOME OBJECTS NOT FOUND FOR FSR (FINGER ", finger, " )\n"); 
                }     
            }

            found = true;
            if (DEBUGGING_MAXOBJECTS) {
                post("\n Parameter objects for fsr ", i, " (finger ",finger, ")\n");
            }
            
            for (j=0 ; j<NFSRPARS ; j++) {
                object = setup.getnamed(varname_constructor_fsrPar(FSR_FINGERS[i],j,"id")); 
                if (typeof(object == "undefined")) {
                    MAXOBJECTS[MAXOBJECT_FSRS_IDX][i][MAXOBJECT_FSR_PAR_IDX][j] = object;
                } else if (DEBUGGING_MAXOBJECTS) {
                    found = false;
                }
            }
            if (DEBUGGING_MAXOBJECTS) {
                if (found) {
                    post("\n PARAMETER OBJECTS FOUND FOR FSR (FINGER ", finger, " )\n");
                } else {
                    post("\n SOME PARAMETER OBJECTS NOT FOUND FOR FSR (FINGER ", finger, " )\n"); 
                }   
                
            }
        }
        if (DEBUGGING_MAXOBJECTS) {
            printMaxObjs()
        }
    }

    function init() {
        dataDefaultStatus = init_data_array();
        init_flexos_arrays();
        init_maxObj_array();
        get_maxObj_names();
        reset_default_env();
        reset_UI();
        call_last_scene();
        initialised = true;
        outlet(OUTLET_PRINT,"glove_JS_proto2x3 SUCCESFULLY INITIALISED\n ");
    }

// RESET FUNCTIONS
    function resetdata() {
        init_data_array();
    }

    function reset_default_env() {
        // rewrite default flex env in dictEnvs
        dictEnvs.replace("Default 1:1",FLEX_ENV_DEFAULT);
    }

    function reset_UI() {
        // reset envDot positions in UI
        for ( i=0 ; i < NFLEX ; i++) {
            post("RESET UI, IDX ",i,"\n")
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_DOT_IDX].message(["setnode", 1, 0, 1]);
            //outlet(OUTLET_RT_DATA,["dynUI",i,"dot",0, 1]);
        }
    }

    function call_last_scene() {
        // RELOAD PREVIOUS STATUS

        // reload last scene that had been called
        var validScene = false;
        if (dictHistory.contains("lastScene")) {
            var scene = dictHistory.get("lastScene");
            post("JS INIT. Loading Scene: ",scene,"\n");
            if (dictPresets.contains(scene)) {
                validScene = loadScene(scene)
            }
        }
        if (!(validScene)) { // then load default values
            post("JS INIT. No Scene available\n");
            refresh_clock(CLOCK_DEFAULT);
            if (!(dataDefaultStatus)) {
                dataDefaultStatus = init_data_array;
            }
            for (var i=0 ; i < NFLEX ; i++) {
                //ENVS
                var key = "lastEnvFlex_" + i.toString();
                var envName = (dictHistory.contains(key)) ? key : "Default 1:1";
                call_flex_env(i,envName);
                
                //REFRESH MAX OBJECTS
                refresh_flex_mute(i,FLEX_MUTE_DEFAULT);
                for (var j=0 ; j < NFLEXPARS ; j++) {
                    refresh_flex_param(i,j,[PAR_NOID_DEFAULT,PAR_MIN_DEFAULT,PAR_MAX_DEFAULT,PAR_EXP_DEFAULT]);
                }
            }
        }
    }

    function set_clock(v) {
        data[DATAIDX_clock] = v;
        printData();
    }

// FLEX ENV FUNCTIONS
    // idx, 0. 0. 0.521252 14.8 1. 127. (x: 0. to 1. ; y: 0 to 127)
    function flexEnv() { // arguments: flexIdx, x0, y0,...
        //post("flexodyn arguments: ", JSON.stringify(arguments), "\n")
        var flexIdx = FLEX_FINGERS.indexOf(arguments[0]);
        newFlexoDyns.push(flexIdx); // record the envs that has changed to check which flexo values will have to be re-scaled 
        
        data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env].length = 0; 
        for (var argIdx = 1; argIdx < arguments.length; argIdx++) {
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env].push(arguments[argIdx]);
        }
        flexosCurrentEnv[flexIdx] = "none"; // signals that the env has been edited meaning that no preset has been selected (in case user saves scene)
        
        if (DEBUGGING_DATA) {
            printData();
        }
    }

    function saveEnv() {
        var flexIdx = FLEX_FINGERS.indexOf(arguments[0]);
        post("saveEnv flexo: ",flexIdx,"\n")
        var preset = "";
        for (var argument = 1; argument < arguments.length; argument++) {
            if (arguments[argument]!= "symbol") {
                preset += arguments[argument];
            }
        }
        if (preset === "Default") {
            outlet(OUTLET_PRINT,"ERROR : CANNOT OVERWRITE DEFAULT PRESET " + preset);
        } else {
            write_env_to_dict(flexIdx,preset);
        } 
    }

    function autosaveEnv(flexIdx,preset) {
        var idx = FLEX_FINGERS.indexOf(flexIdx);
        write_env_to_dict(idx,preset);
    }

    function write_env_to_dict(dataIdx,preset) {
        //var dataIdx = FLEX_FINGERS.indexOf(flexIdx);
        dictEnvs.replace(preset, data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env]);
        flexosCurrentEnv[dataIdx] = preset;
        outlet(OUTLET_PRINT,"FLEX ENV " + preset + " stored succesfully");
        //outlet(OUTLET_REFRESH, "refresh_env_presets", -1);
        
        refresh_flex_env_menu(dataIdx,preset)
        //set_flex_env_menus();
    }

    function refresh_flex_env_menu(dataIdx,preset) {
        //post("PORCODDDIO dataIdx ",dataIdx, " PRESET ",preset,"\n")
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][dataIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message("clear");
        var keys = dictEnvs.getkeys();
        for (var i=0; i<keys.length; i++) {
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][dataIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message(["append",keys[i]]);
        }
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][dataIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message(["set",preset]);
        
    }
    
    function writeEnvToHistory(flexIdx,preset) {
        dictHistory.replace("lastEnvFlex_" + flexIdx.toString(),preset)
    }

    function loadEnv() {
        var flexIdx = arguments[0]; 
        var dataIdx = FLEX_FINGERS.indexOf(flexIdx);
        var preset = "";
        for (var argument = 1; argument < arguments.length; argument++) {
            if (arguments[argument]!= "symbol") {
                preset += arguments[argument];
            }
        }
        
        post("load Env: ",preset, "for flex: ",flexIdx, " in data idx: ",dataIdx,"\n")
        call_flex_env(dataIdx,preset);
        writeEnvToHistory(dataIdx,preset);
        newFlexoDyns.push(flexIdx); // record the envs that has changed to check which flexo values will have to be re-scaled 

    }

    function load_env(dataIdx,name) { 
        post("load Env: ",name, "for flex data idx: ",dataIdx,"\n")
        call_flex_env(dataIdx,name);
        writeEnvToHistory(dataIdx,name);
        newFlexoDyns.push(name); // record the envs that has changed to check which flexo values will have to be re-scaled 

    }


    function call_flex_env(dataIdx,preset) {
        post("calling env ",preset, " for flex data idx ",dataIdx," :\n")
        if (dictEnvs.contains(preset)) {
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env] = dictEnvs.get(preset);
        
            //post(JSON.stringify(data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env]),"\n");
            
            for (var i = 0; i < data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env].length; i+= 2) {
                var x = data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env][i];
                var y = data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_env][i+1];
                if (i == 0) {
                    MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][dataIdx][MAXOBJECT_FLEX_ENV_IDX].message("clear");
                    //outlet(OUTLET_RT_DATA,["dynUI",dataIdx, "env", "new", x, y]); // first point of the env also send message "clear" to UI
                } 
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][dataIdx][MAXOBJECT_FLEX_ENV_IDX].message([x,y]);
                    //outlet(OUTLET_RT_DATA,["dynUI",dataIdx, "env", x, y]);      
            }
        } else {
            outlet(OUTLET_PRINT,"ERROR : CANNOT FIND ENV " + preset);
        }
        flexosCurrentEnv[dataIdx] = preset;
        refresh_flex_env_menu(dataIdx,preset)
    }

    function deleteEnv() {
        var preset = "";
        for (var argument = 0; argument < arguments.length; argument++) {
            if (arguments[argument]!= "symbol") {
                preset += arguments[argument];
            }
        }
        post("delete Env: ",preset,"\n")
        if (dictEnvs.contains(preset)) {
            dictEnvs.remove(preset);
            outlet(OUTLET_PRINT,"ENV " + preset + " DELETED");
        } else {
            outlet(OUTLET_PRINT,"ERROR : CANNOT FIND ENV " + preset);
        }
        for (var i=0; i < NFLEX; i++) {
            if (flexosCurrentEnv[i] == preset) {
                refresh_flex_env_menu(i,"Default 1:1");
            }
        }
        
    }

// CALL/SAVE SCENE FUNCTIONS
    function loadScene() {
        post("FUNCTION LOAD SCENE");
        // scene name
        var scene = "";
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]!= "symbol") {
                scene += arguments[i];
            }
        }
        post(scene,"\n")
        if (dictPresets.contains(scene)) {
            post(scene, "scene found \n");
            //GET CLOCK
            data[DATAIDX_clock] = dictPresets.get(scene + keyClock);
            refresh_clock(data[DATAIDX_clock]);
            post("clock refreshed: ", data[DATAIDX_clock], "\n");
            //FOR EACH FLEX
            for (var i = 0; i < NFLEX; i++) {
                // GET NAME OF THE ENV PRESET 
                var flexEnvPreset = dictPresets.get(key_constructor_flexEnv(scene,i)); 
                post("flex data idx ", i, ", env preset: ", flexEnvPreset, "\n");
                load_env(i,flexEnvPreset)

                var mute =  dictPresets.get(key_constructor_flexMute(scene,i));
                refresh_flex_mute(i,mute);   
                
                // GET PARAMETERS 
                for (var j = 0; j < NFLEXPARS; j++) {
                    post("par ", 0, ", env preset: ", flexEnvPreset, "\n");
                    var id = dictPresets.get(key_constructor_flexPar(scene,i,j) + "::id"); 
                    var min = dictPresets.get(key_constructor_flexPar(scene,i,j) + "::min"); 
                    var max = dictPresets.get(key_constructor_flexPar(scene,i,j) + "::max"); 
                    var exp = dictPresets.get(key_constructor_flexPar(scene,i,j) + "::exp"); 
                    recalled_flex_par_to_data(i,j,[id,min,max,exp]);
                
                    refresh_flex_param(i,j,[id,min,max,exp]);
                }
            }
            
            writeSceneToHistory(scene)
            return true
        } else {
            outlet(OUTLET_PRINT,"ERROR : CAN'T FIND SCENE " + scene);
            return false
        }
    }

    function writeSceneToHistory(scene) {
        dictHistory.replace("lastScene",scene);
    }

    function recalled_flex_par_to_data(flexIdx,parIdx,arr) {
        data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx] = arr;
    }

// SEND DATA TO MAX OBJECTS FUNCTIONS
    function refresh_clock(val) { 
        MAXOBJECTS[MAXOBJECT_CLOCK_IDX].message(val);
    }

    function refresh_flex_mute(flexIdx,val) {
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_MUTE_IDX].message(val);
    }

    function refresh_flex_param(flexIdx,parIdx,arr) { 
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_ID_IDX].message([arr[0]]);
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_MIN_IDX].message([arr[1]]);
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_MAX_IDX].message([arr[2]]);
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_EXP_IDX].message([arr[3]]);
    }

    function saveScene() {
        
        // scene name
        var scene = "";
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]!= "symbol") {
                scene += arguments[i];
            }
        }
        if (DEBUGGING_SCENE) {
            post("SAVING SCENE: ", scene, "\n")
        }
        // flex envs
        for (i = 0; i < flexosCurrentEnv.length; i++) {
            if (DEBUGGING_SCENE) {
                post("Flex data idx ", i, "current env: ", flexosCurrentEnv[i],"\n");
            }
            if ( (flexosCurrentEnv[i] == "none") || (!(dictEnvs.contains(flexosCurrentEnv[i])) ) ) {
                var newName = scene + "_autosave_" + i.toString();
                autosaveEnv(i,newName) 
                flexosCurrentEnv[i] = newName;
            }
        }

        write_scene_to_dict(scene);
        writeSceneToHistory(scene);
        outlet(OUTLET_REFRESH, "refresh_scene_menu");
        outlet(OUTLET_REFRESH, "set_scene_menu", scene);
        outlet(OUTLET_PRINT,"SCENE " + scene + " stored succesfully");
    }

    function write_scene_to_dict(scene) { 
        // SAVE CLOCK
        dictPresets.replace(scene + keyClock, data[DATAIDX_clock]);
        if (DEBUGGING_SCENE) {
            post(keyClock, " ", data[DATAIDX_clock], "\n")
        }
        for (var i = 0; i < NFLEX; i++) {
            // SAVE FLEX MUTE
            if (DEBUGGING_SCENE) {
                post(key_constructor_flexMute(scene,i), " ", data[DATAIDX_flexs][i][DATAIDX_FLEX_mute]); //data[CLOCK_DEFAULT,[ [0] ] ]
            }
            dictPresets.replace(key_constructor_flexMute(scene,i),data[DATAIDX_flexs][i][DATAIDX_FLEX_mute]);
            // SAVE FLEX ENVS
            if (DEBUGGING_SCENE) {
                post(key_constructor_flexEnv(scene,i), " ", flexosCurrentEnv[i], "\n")
            }
            dictPresets.replace(key_constructor_flexEnv(scene,i) , flexosCurrentEnv[i]);

            // GET PARAMETERS 
            for (var j = 0; j < NFLEXPARS; j++) {
                if (DEBUGGING_SCENE) {
                    //data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_id] = id;
                    post(key_constructor_flexPar(scene,i,j)+ "::id", " ", data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_id], "\n")
                    post(key_constructor_flexPar(scene,i,j)+ "::min", " ", data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_min], "\n")
                    post(key_constructor_flexPar(scene,i,j)+ "::max", " ", data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_max], "\n")
                    post(key_constructor_flexPar(scene,i,j)+ "::exp", " ", data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_exp], "\n")
                }
                dictPresets.replace(key_constructor_flexPar(scene,i,j) + "::id" , data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_id]);
                dictPresets.replace(key_constructor_flexPar(scene,i,j) + "::min" , data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_min]);
                dictPresets.replace(key_constructor_flexPar(scene,i,j) + "::max" , data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_max]);
                dictPresets.replace(key_constructor_flexPar(scene,i,j) + "::exp" , data[DATAIDX_flexs][i][DATAIDX_FLEX_params][j][DATAIDX_FLEX_PAR_exp]);
            }
        }
        outlet(2,"PRESET " + scene + " stored succesfully");DATAIDX_FLEX_PAR_min
        outlet(1, "refresh");
    }

// CONSTRUCTORS
    function key_constructor_flexEnv(scene,flexIdx) { 
        return scene + keyFlex_n + flexIdx.toString() + keyFlexEnv;
    }

    function key_constructor_flexMute(scene,flexIdx) {
        return scene + keyFlex_n + flexIdx.toString() + keyMute;
    }

    function key_constructor_flexPar(scene,flexIdx,parIdx) { 
        return scene + keyFlex_n + flexIdx.toString() + keyPar + parIdx.toString();
    }

    function varname_constructor_flexPar(flexIdx,parIdx,parName) {
        return "flex_param_" + parName + "_" + flexIdx + "_" + num_to_alphabetical(parIdx);
    }

    function varname_constructor_fsrPar(fsrIdx,parIdx,parName) {
        return "fsr_param_" + parName + "_" + fsrIdx + "_" + num_to_alphabetical(parIdx); 
    }

    function varname_constructor_fsrNoteOut(fsrIdx,parIdx) {
        return "fsr_midinoteout" + "_" + fsrIdx + "_" + num_to_alphabetical(parIdx); 
    }



//REAL-TIME DATA PROCESSING FUNCTIONS
    function flexovals() {
        //post("FUNCTION FLEXOVALS \n");
        if (initialised) {
            //post("flexovals args: " , JSON.stringify(arguments),"\n")
            
            for (var flexIdx = 0; flexIdx < NFLEX; flexIdx++) {
                var valIn = arguments[flexIdx];
                if ( (valIn != flexosValInHist[flexIdx]) || (newFlexoDyns.indexOf(flexIdx) != -1) ) {
                    flexosValInHist[flexIdx] = valIn;
                    //post("flexo: ",flexIdx, ", valIn: ", valIn, "\n")
                    var curvedIn = scaleExp(
                        valIn,
                        flexosRange[flexIdx][0],flexosRange[flexIdx][1],
                        0,1,
                        FLEXOS_CURVE_EXP); 
                    //post("curvedIn: ", curvedIn, "\n")
                    curvedIns[flexIdx] = curvedIn;

                    var env = data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env];
                    //post("env: ", JSON.stringify(env),"\n")
                    var envIdx = 2; // first point of env should be 0 0 ! 
                    var found = false;
                    while ( (!(found)) && (envIdx < env.length)) {
                        if (curvedIn <= env[envIdx]) {
                            found = Math.floor(envIdx);
                            break
                        }
                        envIdx += 2;
                    }
                    //post("FOUND? ",found,"\n")
                    if (found) {
                        //post("val in is between ", env[found - 2], " and ", env[found], " idx: ", found,"\n" )
                        var midiCC = scale(curvedIn, env[found - 2], env[found], env[found - 1], env[found + 1]);
                        //post("midiCC: ", midiCC, "\n")
                        flexosValOutHist[flexIdx] = midiCC ;
                        var UIdot = scale(midiCC, 0, 127, 0, 1);
                        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_DOT_IDX].message(["setnode", 1, curvedIn, 1 - UIdot]);
                        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_SLIDERUI_IDX].message(curvedIn);
                        //outlet(OUTLET_RT_DATA,["dynUI",flexIdx,"dot",curvedIn, 1 - UIdot]);
                        //outlet(OUTLET_RT_DATA,["dynUI",flexIdx,"slider",curvedIn]);                           
                    }     
                }
            }
            //post("midiCC: ", flexosValOutHist, "\n") 
            outlet(OUTLET_RT_DATA,["flexoCC",flexosValOutHist[0],flexosValOutHist[1]]);
            outlet(OUTLET_RT_DATA,["flexoToUI",curvedIns[0],curvedIns[1]]); 
                //// idx, 0. 0. 0.521252 14.8 1. 127. (x: 0. to 1. ; y: 0 to 127)
            newFlexoDyns.length = 0; // reset
        }
    }

    function flexosrange() {
        //post("flexosrange args: " ,JSON.stringify(arguments),"\n")
        flexosRange.length = 0;
        for (var i = 0; i < arguments.length; i+=2) {
            flexosRange.push([arguments[i],arguments[i+1]]);
        }
    }

    function flexoscurve(v) {
        FLEXOS_CURVE_EXP = ( (v >= 0.125) && (v <= 8) ) ? v : FLEXOS_CURVE_EXP;
    }

    // UI TO DATA FUNCTIONS
    function muteFlex() { 
        if (initialised) {
            var flexIdx = arguments[0];
            var dataIdx = FLEX_FINGERS.indexOf(flexIdx); 
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_mute]  = arguments[1]; 
        }
    } 

    function idParFlex() { 
        if (initialised) {      
            var flexIdx = arguments[0]
            var dataIdx = FLEX_FINGERS.indexOf(flexIdx); 
            var parIdx = arguments[1];
            var id = arguments[2];
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_id] = id;
            if (DEBUGGING_DATA) {
                post("flex ", flexIdx, ", data idx ", dataIdx, ", par ", parIdx, ", id: ",
                    data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_id], "\n")
            }
        }
    }

    function minParFlex() { 
        if (initialised) {            
            var flexIdx = arguments[0]
            var dataIdx = FLEX_FINGERS.indexOf(flexIdx); 
            var parIdx = arguments[1];
            var min = arguments[2];
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_min] = min;
            if (DEBUGGING_DATA) {
                post("flex ", flexIdx, ", data idx ", dataIdx, ", par ", parIdx, ", min: ",
                    data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_min], "\n")
            }
        }
    }

    function maxParFlex() { 
        if (initialised) {         
            var flexIdx = arguments[0]
            var dataIdx = FLEX_FINGERS.indexOf(flexIdx); 
            var parIdx = arguments[1];
            var max = arguments[2];
            post("argument max ",max,"\n")
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_max] = max;
            if (DEBUGGING_DATA) {
                post("flex ", flexIdx, ", data idx ", dataIdx, ", par ", parIdx, ", max: ",
                    data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_max], "\n")
            }
        }
    }

    function expParFlex() { 
        if (initialised) {      
            var flexIdx = arguments[0]
            var dataIdx = FLEX_FINGERS.indexOf(flexIdx); 
            var parIdx = arguments[1];
            var exp = arguments[2];
            data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_exp] = exp;
            if (DEBUGGING_DATA) {
                post("flex ", flexIdx, ", data idx ", dataIdx, ", par ", parIdx, ", exp: ",
                    data[DATAIDX_flexs][dataIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_exp], "\n")
            }
        }
    }

    function muteFsr() { 
        if (initialised) {
            var finger = arguments[0]
            var fsrIdx = FSR_FINGERS.indexOf(finger); 
            data[DATAIDX_fsrs][fsrIdx][DATAIDX_FSR_mute]  = arguments[1]; 
        }
    }  

    function fsrGates() {
        if (initialised) {
            for (var i = 0; i < arguments.length; i++) {
                var fsrIdx = FLEX_FINGERS.indexOf(i); 
                if (fsrIdx != -1) {
                    data[DATAIDX_fsrs][fsrIdx][DATAIDX_FSR_gate] = arguments[i];
                }
            }
        }
    }

    function idParFsr() { 
        if (initialised) {
            //post("idParFsr, args: ",JSON.stringify(arguments),"\n")
            var finger = arguments[0]
            var fsrIdx = FSR_FINGERS.indexOf(finger); 
            var parIdx = arguments[1];
            var id = arguments[2];
            data[DATAIDX_fsrs][fsrIdx][DATAIDX_FSR_params][parIdx] = id;
        }
    }

    function midiNoteOutFsr() {
        if (initialised) {
            //post("midiNoteOutFsr, args: ",JSON.stringify(arguments),"\n")
            var finger = arguments[0]
            var fsrIdx = FSR_FINGERS.indexOf(finger); 
            for (var i = 1; i < arguments.length; i++) {
                data[DATAIDX_fsrs][fsrIdx][DATAIDX_FSR_noteouts] = arguments[i];
            }
        }
    }

// UTILITY FUNCTIONS
    function num_to_alphabetical(n) {
        var nToAlphab = ["A","B","C","D","E","F","G","H"];
        return nToAlphab[n];
    }

    function scale(x, in_low,in_high, out_low, out_high) {
        return ((x-in_low)/(in_high-in_low) == 0) ? out_low : (((x-in_low)/(in_high-in_low)) > 0) ? out_low + (out_high-out_low) * ((x-in_low)/(in_high-in_low)) : ( out_low + (out_high-out_low) * -(((-x+in_low)/(in_high-in_low))));
    }

    function scaleExp(x, in_low,in_high, out_low, out_high, exp) {
        return ((x-in_low)/(in_high-in_low) == 0) ? out_low 
            : (((x-in_low)/(in_high-in_low)) > 0) ? 
            (out_low + (out_high-out_low) * Math.pow((x-in_low)/(in_high-in_low),exp)) 
            : ( out_low + (out_high-out_low) * -(Math.pow(((-x+in_low)/(in_high-in_low)),exp)));
    }

// PRINT FUNCTIONS
    function printData() {
        post("\n PRINT DATA:\n")
        post(JSON.stringify(data),"\n");
    }

    function printMaxObjs() {
        post("\n MAXOBJECTS TABLE: \n");
        post(JSON.stringify(MAXOBJECTS),"\n");
    }



            