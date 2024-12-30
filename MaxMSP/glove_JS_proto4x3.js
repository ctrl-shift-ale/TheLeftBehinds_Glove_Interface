
    autowatch = 1;
    outlets = 4; // 0: real time data, 1:refresh triggers, 2:preset data, 3: print

    var NFLEX = 4;
    var NFLEXPARS =4;
    var FLEX_SCALE_OUT = [0.0, 127.0];

    var OUTLET_RT_DATA = 0;
    var OUTLET_REFRESH = 1;
    var OUTLET_PRESET = 2;
    var OUTLET_PRINT = 3;

    var CLOCK_DEFAULT = 100;
    var PAR_NOID_DEFAULT = 0; 
    var PAR_MIN_DEFAULT = 0.0;
    var PAR_MAX_DEFAULT = 1.0;
    var PAR_EXP_DEFAULT = 1.0;

    var FLEX_MUTE_DEFAULT = 0;
    var FLEX_ENV_DEFAULT = [0, FLEX_SCALE_OUT[0], 1, FLEX_SCALE_OUT[1]];

    var dictPresets = new Dict("glove_presets");
    var dictEnvs = new Dict("glove_envs");
    var dictHistory = new Dict("history");
    var keyClock = "::clock";
    var keyFlex_n = "::flex::"
    var keyFlexEnv = "::env";
    var keyFlexMute = "::mute";
    var keyFlexPar_n = "::par::";

    var data = []
    var dataDefaultStatus = false;
    var DATAIDX_clock = 0;
    var DATAIDX_flexs = 1;

    var DATAIDX_FLEX_mute = 0;
    var DATAIDX_FLEX_env = 1;
    var DATAIDX_FLEX_params = 2;

    var DATAIDX_FLEX_PAR_id = 0;
    var DATAIDX_FLEX_PAR_min = 1;
    var DATAIDX_FLEX_PAR_max = 2;
    var DATAIDX_FLEX_PAR_exp = 3;


    //var DATAIDX_fsrGate = 7;
    //var DATAIDX_fsrHyst = 8;

    var flexosRange = [[0,8191] , [0,8191], [0,8191], [0,8191], [0,8191]];
    var flexosValInHist = [0, 0, 0, 0];
    var flexosValOutHist = [0, 0, 0, 0];
    var newFlexoDyns = [];
    var curvedIns = [0,0,0,0];
    var flexCurrentEnv = ["none","none","none","none","none"];

    var flexosCurveExp = 2;

    //MAX OBJECTS
    var MAXOBJECTS = [];
    /*
    var MAXOBJECTS = [
        "pacelholder_clock", //MAXOBJECTS[MAXOBJECT_CLOCK_IDX]
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
        ]
    ];
*/
    
    var MAXOBJECT_CLOCK_IDX = 0;
    var MAXOBJECT_FLEXOS_IDX = 1; 

    var MAXOBJECT_FLEX_MUTE_IDX = 0; 
    var MAXOBJECT_FLEX_ENV_IDX = 1;
    var MAXOBJECT_FLEX_ENVMENU_IDX = 2;
    var MAXOBJECT_FLEX_DOT_IDX = 3; 
    var MAXOBJECT_FLEX_SLIDERUI_IDX = 4;
    var MAXOBJECT_FLEX_PAR_IDX = 5;

    var MAXOBJECT_FLEX_PAR_ID_IDX = 0;
    var MAXOBJECT_FLEX_PAR_MIN_IDX = 1;
    var MAXOBJECT_FLEX_PAR_MAX_IDX = 2;
    var MAXOBJECT_FLEX_PAR_EXP_IDX = 3;

    var initialised = false;

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
            
            for (var _=0 ; _<NFLEXPARS ; _++) {
                data[DATAIDX_flexs][i].push(
                    [PAR_NOID_DEFAULT,PAR_MIN_DEFAULT,PAR_MAX_DEFAULT,PAR_EXP_DEFAULT] //data[CLOCK_DEFAULT,[ [0,[0,0,1,127] , [PAR_NOID_DEFAULT,PAR_MIN_DEFAULT,PAR_MAX_DEFAULT,PAR_EXP_DEFAULT] ] ] ]
                )
            }
        }
        printData();
        return true
    }

    function init_maxObj_array() {
        MAXOBJECTS.length = 0;
        MAXOBJECTS.push("placeholder_clock"); //MAXOBJECTS[MAXOBJECT_CLOCK_IDX]
        MAXOBJECTS.push([]); //MAXOBJECTS[MAXOBJECT_FLEXOS_IDX]
        for (var i=0 ; i < NFLEX; i++) {
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX].push([])
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
        
    }
    function get_maxObj_names() {
        var root = this.patcher; 
        // GET VARNAME OF CLOCK NUMBOX
        MAXOBJECTS[MAXOBJECT_CLOCK_IDX] = root.getnamed("clock_numbox"); 
        var setup = root.getnamed("subp_setup").subpatcher();
        // GET VARNAME OF FLEX PARAM OBJECTS
        var maxObj_flexPar_prefixes = ["id" ,"min", "max", "exp"];
        printMaxObjs();
        for (i=0 ; i<NFLEX; i++) {  
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_MUTE_IDX] = setup.getnamed("flex_mute_"+i.toString());
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_ENV_IDX] = setup.getnamed("flex_env_"+i.toString());
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_ENVMENU_IDX] = setup.getnamed("flex_envMenu_"+i.toString());
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_DOT_IDX] = setup.getnamed("flex_dot_"+i.toString()); 
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_SLIDERUI_IDX] = setup.getnamed("flex_slider_ui_"+i.toString()); 
            for (var j=0 ; j<NFLEXPARS ; j++) {
                for (var k=0 ; k<maxObj_flexPar_prefixes.length ; k++) {
                    //post("VARNAME: ",varname_constructor_flexPar(i,j,maxObj_flexPar_prefixes[k]))
                    MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][i][MAXOBJECT_FLEX_PAR_IDX][j][k] = setup.getnamed(varname_constructor_flexPar(i,j,maxObj_flexPar_prefixes[k])); 
                    //[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_PAR_IDX][parIdx][MAXOBJECT_FLEX_PAR_ID_IDX]
                }
            }
        }
        printMaxObjs()
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

    function init() {
        dataDefaultStatus = init_data_array();
        init_maxObj_array();
        get_maxObj_names();
        flexosRange = [[0,8191] , [0,8191], [0,8191], [0,8191], [0,8191]];
        flexosValInHist = [0, 0, 0, 0, 0, 0];
        flexosValOutHist = [0, 0, 0, 0, 0, 0];
        newFlexoDyns.length = 0;
        flexCurrentEnv = ["none","none","none","none","none"];
        reset_default_env();
        reset_UI();
        call_last_scene();
        initialised = true;
        outlet(OUTLET_PRINT,"glove_JS_proto4x3 SUCCESFULLY INITIALISED\n ");
    }


    function resetdata() {
        init_data_array();
    }

    function set_clock(v) {
        data[DATAIDX_clock] = v;
        printData();
    }

    function muteFsr() {
        var pass = 0;
    }
    // ENV

    // idx, 0. 0. 0.521252 14.8 1. 127. (x: 0. to 1. ; y: 0 to 127)
    function flexEnv() { // arguments: flexIdx, x0, y0,...
        //post("flexodyn arguments: ", JSON.stringify(arguments), "\n")
        var flexIdx = arguments[0];
        newFlexoDyns.push(flexIdx); // record the envs that has changed to check which flexo values will have to be re-scaled 
        
        data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env].length = 0; 
        for (var argIdx = 1; argIdx < arguments.length; argIdx++) {
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env].push(arguments[argIdx]);
        }
        flexCurrentEnv[flexIdx] = "none"; // signals that the env has been edited meaning that no preset has been selected (in case user saves scene)
        
        printData();

    }

    function saveEnv() {
        var flexIdx = arguments[0];
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
        write_env_to_dict(flexIdx,preset);
    }

    function write_env_to_dict(flexIdx,preset) {
        dictEnvs.replace(preset, data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env]);
        flexCurrentEnv[flexIdx] = preset;
        outlet(OUTLET_PRINT,"FLEX ENV " + preset + " stored succesfully");
        //outlet(OUTLET_REFRESH, "refresh_env_presets", -1);
        
        refresh_flex_env_menu(flexIdx,preset)
        //set_flex_env_menus();
    }

    function refresh_flex_env_menu(flexIdx,preset) {
        //post("PORCODDDIO flexIdx ",flexIdx, " PRESET ",preset,"\n")
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message("clear");
        var keys = dictEnvs.getkeys();
        for (var i=0; i<keys.length; i++) {
            MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message(["append",keys[i]]);
        }
        MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENVMENU_IDX].message(["set",preset]);
        
    }
    function writeEnvToHistory(flexIdx,preset) {
        dictHistory.replace("lastEnvFlex_" + flexIdx.toString(),preset)
    }



    function loadEnv() {
        var flexIdx = arguments[0]; 
        var preset = "";
        for (var argument = 1; argument < arguments.length; argument++) {
            if (arguments[argument]!= "symbol") {
                preset += arguments[argument];
            }
        }
        post("load Env: ",preset, "for flex: ",flexIdx,"\n")
        call_flex_env(flexIdx,preset);
        writeEnvToHistory(flexIdx,preset);
        newFlexoDyns.push(flexIdx); // record the envs that has changed to check which flexo values will have to be re-scaled 

    }

    function load_env(flexIdx,name) { 
        post("load Env: ",name, "for flex: ",flexIdx,"\n")
        call_flex_env(flexIdx,name);
        writeEnvToHistory(flexIdx,name);
        newFlexoDyns.push(name); // record the envs that has changed to check which flexo values will have to be re-scaled 

    }


    function call_flex_env(flexIdx,preset) {
        //post("calling env ",preset, " for flex ",flexIdx," :\n")
        if (dictEnvs.contains(preset)) {
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env] = dictEnvs.get(preset);
        
            //post(JSON.stringify(data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env]),"\n");
            
            for (var i = 0; i < data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env].length; i+= 2) {
                var x = data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env][i];
                var y = data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_env][i+1];
                if (i == 0) {
                    MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENV_IDX].message("clear");
                    //outlet(OUTLET_RT_DATA,["dynUI",flexIdx, "env", "new", x, y]); // first point of the env also send message "clear" to UI
                } 
                MAXOBJECTS[MAXOBJECT_FLEXOS_IDX][flexIdx][MAXOBJECT_FLEX_ENV_IDX].message([x,y]);
                    //outlet(OUTLET_RT_DATA,["dynUI",flexIdx, "env", x, y]);      
            }
        } else {
            outlet(OUTLET_PRINT,"ERROR : CANNOT FIND ENV " + preset);
        }
        flexCurrentEnv[flexIdx] = preset;
        refresh_flex_env_menu(flexIdx,preset)
    }

    /*
    function set_flex_env_menus() {
        for (var i=0; i < flexCurrentEnv.length; i++) {
            var preset = flexCurrentEnv[i];
            if (preset != "none") {
                outlet(OUTLET_REFRESH, ["set_flex_env_menu",i,preset]);
            }
        }
    }
    */
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
            if (flexCurrentEnv[i] == preset) {
                refresh_flex_env_menu(i,"Default 1:1");
            }
        }
        
    }

    // SCENE

    function loadScene(scene) {
        if (dictPresets.contains(scene)) {
            //GET CLOCK
            data[DATAIDX_clock] = dictPresets.get(scene + keyClock);
            refresh_clock();
            //FOR EACH FLEX
            for (var i = 0; i < NFLEX.length; i++) {
                // GET NAME OF THE ENV PRESET 
                var flexEnvPreset = dictPresets.get(key_constructor_flexEnv(scene,i)); 
                load_env(i,flexEnvPreset)

                var mute =  dictPresets.get(keyPrefix + keyFlexMute);
                refresh_flex_mute(i,mute);   
                
                // GET PARAMETERS 
                for (var j = 0; j < NFLEXPARS.length; j++) {
                    var parArr = dictPresets.get(key_constructor_flexPar(scene,i,j)); // array
                    
                    flex_par_to_data(i,j,parArr);
                
                    refresh_flex_param(i,j,parArr);
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

    function flex_par_to_data(flexIdx,parIdx,arr) {
        data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx] = arr;
    }

    // SEND DATA TO MAX OBJECTS
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
    };

    function saveScene() {
        var scene = "";
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]!= "symbol") {
                scene += arguments[i];
            }
        }
        for (i = 0; i < flexCurrentEnv.length; i++) {
            if ( (flexCurrentEnv[i] === "none") || (!(dictEnvs.contains(flexCurrentEnv[i])) ) ) {
                var newName = scene + "_autosave_" + i.toString();
                autosaveEnv(i,newName) 
                flexCurrentEnv[i] = newName;
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
        for (var i = 0; i < NFLEX.length; i++) {
            // SAVE FLEX MUTE
            dictPresets.replace(key_constructor_flexMute(scene,i),data[DATAIDX_flexMute]);
            // SAVE FLEX ENVS
            dictPresets.replace(key_constructor_flexEnv(scene,i) , flexCurrentEnv[i]);

            // GET PARAMETERS 
            for (var j = 0; j < NFLEXPARS.length; j++) {
                dictPresets.replace(key_constructor_flexPar(scene,i,j) , data[DATAIDX_flexParam]);
            }
        }
        outlet(2,"PRESET " + scene + " stored succesfully");
        outlet(1, "refresh");
    }

    // CONSTRUCTORS
    function key_constructor_flexEnv(scene,flexIdx) { 
        return scene + keyFlex_n + flexIdx.toString() + keyFlexEnv;
    }

    function key_constructor_flexMute(scene,flexIdx) {
        return scene + keyFlex_n + flexIdx.toString() + keyFlexMute;
    }

    function key_constructor_flexPar(scene,flexIdx,parIdx) { 
        return scene + keyFlex_n + flexIdx.toString() + keyFlexPar_n + parIdx.toString();
    }

    function varname_constructor_flexPar(flexIdx,parIdx,parName) {
        return "flex_param_" + parName + "_" + flexIdx + "_" + num_to_alphabetical(parIdx);
    }



    //REAL-TIME DATA

    function flexovals() {
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
                        flexosCurveExp); 
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
            outlet(OUTLET_RT_DATA,["flexoCC",flexosValOutHist[0],flexosValOutHist[1],flexosValOutHist[2],flexosValOutHist[3]]);
            outlet(OUTLET_RT_DATA,["flexoToUI",curvedIns[0],curvedIns[1],curvedIns[2],curvedIns[3]]); 
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
        flexosCurveExp = ( (v >= 0.125) && (v <= 8) ) ? v : flexosCurveExp;
    }

    // UI TO DATA
    function muteFlex() { 
        if (initialised) {
            var flexIdx = arguments[0];
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_mute]  = arguments[1]; 
        }
    }

    function idParFlex() { 
        if (initialised) {
            //post("idParFlex, args: ",JSON.stringify(arguments),"\n")
            var flexIdx = arguments[0]
            var parIdx = arguments[1];
            var id = arguments[2];
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_id] = id;
        }
    }

    function minParFlex() { 
        if (initialised) {
            //post("minParFlex, args: ",JSON.stringify(arguments),"\n")
            var flexIdx = arguments[0]
            var parIdx = arguments[1];
            var min = arguments[2];
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_min] = min;
        }
    }

    function maxParFlex() { 
        if (initialised) {
            //post("maxParFlex, args: ",JSON.stringify(arguments),"\n")
            var flexIdx = arguments[0]
            var parIdx = arguments[1];
            var max = arguments[2];
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_max] = max;
        }
    }

    function expParFlex() { 
        if (initialised) {
            //post("expParFlex, args: ",JSON.stringify(arguments),"\n")
            var flexIdx = arguments[0]
            var parIdx = arguments[1];
            var exp = arguments[2];
            data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_exp] = exp;
        }
    }

    function idParFsr() { 
        if (initialised) {
            //post("idParFsr, args: ",JSON.stringify(arguments),"\n")
            var fsrIdx = arguments[0]
            var parIdx = arguments[1];
            var id = arguments[2];
            //data[DATAIDX_flexs][flexIdx][DATAIDX_FLEX_params][parIdx][DATAIDX_FLEX_PAR_id] = id;
        }
    }


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

    function printData() {
        post("\n PRINT DATA:\n")
        post(JSON.stringify(data),"\n");
    }

    function printMaxObjs() {
        post("\n MAX OBJECTS:\n")
        post("\n",JSON.stringify(MAXOBJECTS),"\n");
    }

    /*
    function fsrgate() {
        var idx = arguments[0];
        var val = arguments[1];
        if (idx == -1) {
            data[DATAIDX_fsrGate] = [val,val,val,val,val];
        } else {
            data[DATAIDX_fsrGate] = val;
        }
        printData();
    }

    function fsrgatelist() {
        for (var argument = 0; argument < arguments.length; argument++) {
            data[DATAIDX_fsrGate][argument] = arguments[argument];
        }
        printData();
    }

    function fsrhyst() {
        var idx = arguments[0];
        var val = arguments[1];
        if (idx == -1) {
            data[DATAIDX_fsrHyst] = [val,val,val,val,val];
        } else {
            data[DATAIDX_fsrHyst][idx] = val;
        }
        printData();
    }   

    function fsrhystlist() {
        for (var argument = 0; argument < arguments.length; argument++) {
            data[DATAIDX_fsrHyst][argument] = arguments[argument];
        }
        printData();
    }
        */


            