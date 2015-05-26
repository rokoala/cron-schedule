angular.module("CronSchedule",[])
.directive("simpleCronSchedule",['$compile',function($compile){
	
	var sSchedule = {
		restrict: 'AE',
		scope:{
			schedule:"=?",
			scheduleEdit:"&",
			initialValue:"@"
		},
		controller:function($scope,$element,$attrs){
			this.aCron = ['0','0','0','0','0','0'];
			this.cronDefaultCustomValue = this.aCron.join(" ");
			
			this.cronTypeRegex={
				hourminute_m:/^[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*\s\*$/,
				hourminute_h:/^[0]\s[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*$/,
				week:/0\s(\d{1,2})\s(\d{1,2})\s\*\s\*\s(.*)/
			};
			
			//radio type constant names
			$scope.radioTypes = {
				1:"custom",
				2:"hourminute",
				3:"week"
			};
			
			this.range = {
				hour:[],
				hourincrement:[1,2,3,4,6,8,12,24],
				minute:[],
				minuteincrement:[1,2,3,4,5,6,10,12,15,20,30],
				second:[],
				dayofweek:["SUN","MON","TUE","WED","THU","FRI","SAT"]
			};
			
			$scope.dayofweekConvert={
				"SUN":"SUN",
				"MON":"MON",
				"TUE":"TUE",
				"WED":"WED",
				"THU":"THU",
				"FRI":"FRI",
				"SAT":"SAT"
			};
			
			//translation of days of week
//			this.range.dayofweek.forEach(function(day){
//				$translate(day).then(function(translation){
//					$scope.dayofweekConvert[day] = translation;
//				});
//			});
			
			//hourminute types object (value and name)
			this.hourminute={
				types:[
			       {name:"minute(s)",value:"minute"},
			       {name:"hour(s)",value:"hour"}
				]
			};
			
//			this.hourminute.types.forEach(function(type){
//				$translate(type.name).then(function(translation){
//					type.name = translation;
//				});
//			});
			
			//calculating hour,minute,second ranges
			for(var i=0; i<60;i++){
				if(i<24)
					this.range.hour.push({value:i,name:i+"h"});
				
				this.range.minute.push({value:i,name:i+" min"});
				this.range.second.push({value:i,name:i+" s"});
			}
			
			var that=this;
			
			/**
			 * ==========================
			 *  Cron directive functions
			 * ==========================
			 */
			
			/**
			 * Creates base cron configuration -> * * * * * *
			 */
			this.createBaseCron = function(){
				for(var i=0; i<6; i++){
					that.aCron[i] = '*';
				}
			};
			
			/**
			 * Modify schedule module and generate final cron task string
			 */
			this.generateCron = function(){
				$scope.schedule = that.aCron.join(" ");
				return $scope.schedule;
			};
			
			/**
			 * Generate custom cron type
			 * Gets custom value of custom value and generates cron task string
			 */
			this.generateCustomCron = function(){
				var auxCron = $scope.cron.custom.value.split(" ");
				
				if(auxCron.length <= 6)
					that.aCron = auxCron;
				
				$scope.cron.custom.value = this.generateCron();
			};
			
			/**
			 * Generate hourminute cron type
			 *  - Create base configuration
			 *  - Generates cron task string depending on type selected (hour(s)/minute(s))
			 */
			this.generateHourminuteCron = function(){
				this.createBaseCron();
				
				if($scope.cron.hourminute.type.value === "minute"){
					
					that.aCron[0] = $scope.cron.hourminute.subValue2.value;
					that.aCron[1] = $scope.cron.hourminute.subValue1.value + "/" + $scope.cron.hourminute.value;
					
				}else if($scope.cron.hourminute.type.value === "hour"){
					
					that.aCron[0] = "0";
					that.aCron[1] = $scope.cron.hourminute.subValue2.value;
					that.aCron[2] = $scope.cron.hourminute.subValue1.value + "/" + $scope.cron.hourminute.value;
				}

				$scope.cron.custom.value = this.generateCron();
			};
			
			/**
			 * Generate week cron type
			 * - Create base configuration
			 * - Parse days of week and generate cron task string
			 */
			this.generateWeekCron = function(){
				
				this.createBaseCron();
				
				that.aCron[0] = "0";
				that.aCron[1] = $scope.cron.week.subValue2.value;
				that.aCron[2] = $scope.cron.week.subValue1.value;
				that.aCron[5] = $scope.cron.week.value.join(",");
				
				if(that.aCron[5] === "") that.aCron[5] = "*";
				
				$scope.cron.custom.value = this.generateCron();
			};
			
			/**
			 * Update models that have information about the cron task based on cron type (hourminute_m, hourminute_h, week)
			 * every time that update the scheduleType, it generates cron task string, check watch('scheduleType',...) function
			 */
			this.updateModels = {
				'hourminute_m':function(schedule){
					$scope.scheduleType = $scope.radioTypes["2"];
					$scope.cron.hourminute.type = that.hourminute.types[0];

					//change this to a promise that is created every time that types change
					setTimeout(function(){
						$scope.hourminuteRange.value=that.range.minuteincrement;
						$scope.hourminuteRange.subValue1=that.range.minute;
						$scope.hourminuteRange.subValue2=that.range.second;
						
						$scope.cron.hourminute.subValue2 = that.range.second[parseFloat(schedule[0],10)];
						subschedule = schedule[1].split("/");
						
						$scope.cron.hourminute.subValue1 = that.range.minute[parseFloat(subschedule[0],10)];
						$scope.cron.hourminute.value = parseFloat(subschedule[1],10);
						
						$scope.$apply();
					},10);
				},
				'hourminute_h':function(schedule){
					$scope.scheduleType = $scope.radioTypes["2"];
					$scope.cron.hourminute.type = that.hourminute.types[1];
					
					setTimeout(function(){
    					$scope.hourminuteRange.value=that.range.hourincrement;
    					$scope.hourminuteRange.subValue1=that.range.hour;
    					$scope.hourminuteRange.subValue2=that.range.minute;
						
						$scope.cron.hourminute.subValue2 = that.range.minute[parseFloat(schedule[1],10)];
						subschedule = schedule[2].split("/");
	
						$scope.cron.hourminute.subValue1 = that.range.hour[parseFloat(subschedule[0],10)];
						$scope.cron.hourminute.value = parseFloat(subschedule[1],10);
						$scope.$apply();
					},10);	
				},
				'week':function(schedule){
					$scope.scheduleType = $scope.radioTypes["3"];
					
					$scope.cron.week.subValue2 = that.range.minute[parseFloat(schedule[1],10)];
					$scope.cron.week.subValue1 = that.range.hour[parseFloat(schedule[2],10)];
					
					$scope.cron.week.value = schedule[5].split(",");
				}
			};
			
			/**
			 * Always update cron custom value and also populate the models
			 */
			this.setInitialCron = function(initialCron){
				
        		$scope.cron.custom.value = initialCron;
        		
        		for(regex in that.cronTypeRegex){
        			if(that.cronTypeRegex[regex].exec(initialCron)){
        				if(regex === "week"){
        					//check if valid day of week
        					that.updateModels[regex](initialCron.split(" "));
        				}else{
        					that.updateModels[regex](initialCron.split(" "));
        				}
        			}
        		}
			};
			
		},
        link: function(scope, element, attrs, controller) {
        	
        	// initial schedule configuration
        	scope.schedule = controller.cronDefaultCustomValue;
        	
        	// initial schedule radiobox
        	scope.scheduleType = "custom";

        	// hourminute range configuration
        	scope.hourminuteRange={
        		value:controller.range.minuteincrement,
        		type:controller.hourminute.types,
        		subValue1:controller.range.minute,
        		subValue2:controller.range.second
        	};
        	
        	// day of week range configuration
        	scope.weekRange={
        		value:controller.range.dayofweek,
        		subValue1:controller.range.hour,
        		subValue2:controller.range.minute
        	};
        	
        	// initial cron configuration
        	scope.cron={
        		custom:{
        			disabled:false,
        			value:controller.cronDefaultCustomValue
        		},
        		hourminute:{
        			disabled:true,
        			value:1,
        			type:controller.hourminute.types[0],
        			subValue1:controller.range.minute[0],
        			subValue2:controller.range.second[0]
        		},
        		week:{
        			disabled:true,
        			value:[],
        			subValue1:controller.range.hour[0],
        			subValue2:controller.range.minute[0]
        		}
        	};
        	
        	if(typeof scope.initialValue !== "undefined")
        		controller.setInitialCron(scope.initialValue);
        	
        	//change minute and hour increment range and restart to default first value of the list
        	scope.$watch('cron.hourminute.type',function(newValue,oldValue){
        		if(newValue !== oldValue){
        			switch(newValue.value){
        				case "minute":
        					scope.hourminuteRange.value=controller.range.minuteincrement;
        					scope.cron.hourminute.value=controller.range.minuteincrement[0];
        					
        					scope.hourminuteRange.subValue1=controller.range.minute;
        					scope.cron.hourminute.subValue1=controller.range.minute[0];

        					scope.hourminuteRange.subValue2=controller.range.second;
        					scope.cron.hourminute.subValue2=controller.range.second[0];
        					
        					break;
        					
        				case "hour":
        					scope.hourminuteRange.value=controller.range.hourincrement;
        					scope.cron.hourminute.value=controller.range.hourincrement[0];
        					
        					scope.hourminuteRange.subValue1=controller.range.hour;
        					scope.cron.hourminute.subValue1=controller.range.hour[0];

        					scope.hourminuteRange.subValue2=controller.range.minute;
        					scope.cron.hourminute.subValue2=controller.range.minute[0];
        					
        					break;
        			}	
        		}
        	});
        	
        	/**
        	 * watch combobox selection
        	 * updates cron with current selection values of radio type
        	 */
        	scope.$watch('cron.custom.value',function(newValue,oldValue){
        		if(newValue !== oldValue){
	        		if(scope.scheduleType === scope.radioTypes["1"])
	        			controller.generateCustomCron();
        		}
        	});
        	
        	scope.$watchCollection('[cron.hourminute.type,cron.hourminute.value,cron.hourminute.subValue1,cron.hourminute.subValue2]',function(newValues,oldValues){
        		if(scope.scheduleType === scope.radioTypes["2"])
        			controller.generateHourminuteCron();
        	});

        	scope.$watchCollection('[cron.week.value,cron.week.subValue1,cron.week.subValue2]',function(newValues,oldValues){
        		if(scope.scheduleType === scope.radioTypes["3"])
        			controller.generateWeekCron();
        	});
        	
        	/**
        	 * Watch radio selection
        	 *  - Enable selected radio type
        	 *  - Generate cron task string based on cron model (the function calls the specific generate - custom, hourminute, week function)
        	 */
        	scope.$watch('scheduleType',function(newValue,oldValue){

    			for(var type in scope.radioTypes){
    				scope.cron[scope.radioTypes[type]].disabled=true;
    			}
    			
    			scope.cron[newValue].disabled=false;
    			
    			if (newValue === scope.radioTypes["1"])
    				controller.generateCustomCron();
    			else if(newValue === scope.radioTypes["2"])
    				controller.generateHourminuteCron();
    			else if(newValue === scope.radioTypes["3"])
    				controller.generateWeekCron();
        	});
        	
        	/**
        	 * Checks if is editing (needs scheduleEdit promise)
        	 * scheduleEdit is a promise function that will have schedule string as callback parameter
        	 * and will populate the cron schedule directive asynchronous.
        	 */
        	if(typeof scope.scheduleEdit() !== "undefined"){
        		scope.scheduleEdit().then(function(schedule){
            		controller.setInitialCron(schedule);
        		});
        	}
        },
        templateUrl: 'templates/theme/bootplus.html'
	};
	
	return sSchedule;
	
}]);