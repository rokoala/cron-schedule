/**!
 * AngularJS file simpleCronSchedule and CronSchedule directive
 * @author  RodrigoKoga  <koga.rodrigo@gmail.com>
 * @version 1.0.0
 */
(function(window,angular){

'use strict'

var cron = angular.module("CronSchedule",[]);

cron.directive("simpleCronSchedule",['$compile','$http',function($compile,$http) {
	
    var defaultOptions = {
        translate:false
    };
    
	var sSchedule = {
		restrict: 'AE',
		scope: {
            schedule:"=?",
            options:"=?",
			scheduleEdit:"&",
			initialValue:"@"
		},
		controller:["$scope","$element","$attrs",function($scope,$element,$attrs){
            
            var self = this;
            
            this.options = angular.extend({},defaultOptions,$scope.options);
            
			this.aCron = ['0','0','0','0','0','0'];
			this.cronDefaultCustomValue = this.aCron.join(" ");
            
			this.cronTypeRegex={
				hourminute_m:/^[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*\s\*$/,
				hourminute_h:/^[0]\s[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*$/,
				week:/0\s(\d{1,2})\s(\d{1,2})\s\*\s\*\s(.*)/
			};
			
			this.range={
				hour:[],
				hourincrement:[1,2,3,4,6,8,12,24],
				minute:[],
				minuteincrement:[1,2,3,4,5,6,10,12,15,20,30],
				second:[],
				dayofweek:["SUN","MON","TUE","WED","THU","FRI","SAT"]
			};

			this.hourminute={
				types:[
			       {name:"minute(s)",value:"minute"},
			       {name:"hour(s)",value:"hour"}
				]
			};
			
            $scope.radioTypes={
				1:"custom",
				2:"hourminute",
				3:"week"
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
            
            /*
            //translation of days of week
			this.range.dayofweek.forEach(function(day){
				$translate(day).then(function(translation){
					$scope.dayofweekConvert[day] = translation;
				});
			});
            
			this.hourminute.types.forEach(function(type){
				$translate(type.name).then(function(translation){
					type.name = translation;
				});
			});
            */
			
			//calculating hour,minute,second ranges
			for(var i=0; i<60;i++){
				if(i<24)
					this.range.hour.push({value:i,name:i+"h"});
				
				this.range.minute.push({value:i,name:i+" min"});
				this.range.second.push({value:i,name:i+" s"});
			}
            
			
            
			this.createBaseCron          = createBaseCron;
			this.generateCron            = generateCron;
			this.generateCustomCron      = generateCustomCron;
			this.generateHourminuteCron  = generateHourMinuteCron;
			this.generateWeekCron        = generateWeekCron;
            this.setInitialCron          = setInitialCron;
            
			/**
			 * Update models that have information about the cron task based on cron type (hourminute_m, hourminute_h, week)
			 * every time that update the scheduleType, it generates cron task string, check watch('scheduleType',...) function
			 */
			this.updateModels = {
				'hourminute_m':function(schedule){
					$scope.scheduleType = $scope.radioTypes["1"];
					$scope.cron.hourminute.type = self.hourminute.types[0];

					setTimeout(function(){
						$scope.hourminuteRange.value=self.range.minuteincrement;
						$scope.hourminuteRange.subValue1=self.range.minute;
						$scope.hourminuteRange.subValue2=self.range.second;
						
						$scope.cron.hourminute.subValue2 = self.range.second[parseFloat(schedule[0],10)];
						subschedule = schedule[1].split("/");
						
						$scope.cron.hourminute.subValue1 = self.range.minute[parseFloat(subschedule[0],10)];
						$scope.cron.hourminute.value = parseFloat(subschedule[1],10);
						
						$scope.$apply();
					});
				},
				'hourminute_h':function(schedule){
					$scope.scheduleType = $scope.radioTypes["2"];
					$scope.cron.hourminute.type = self.hourminute.types[1];
					
					setTimeout(function(){
    					$scope.hourminuteRange.value=self.range.hourincrement;
    					$scope.hourminuteRange.subValue1=self.range.hour;
    					$scope.hourminuteRange.subValue2=self.range.minute;
						
						$scope.cron.hourminute.subValue2 = self.range.minute[parseFloat(schedule[1],10)];
						subschedule = schedule[2].split("/");
	
						$scope.cron.hourminute.subValue1 = self.range.hour[parseFloat(subschedule[0],10)];
						$scope.cron.hourminute.value = parseFloat(subschedule[1],10);
						$scope.$apply();
					});	
				},
				'week':function(schedule){
					$scope.scheduleType = $scope.radioTypes["3"];
					
					$scope.cron.week.subValue2 = self.range.minute[parseFloat(schedule[1],10)];
					$scope.cron.week.subValue1 = self.range.hour[parseFloat(schedule[2],10)];
					
					$scope.cron.week.value = schedule[5].split(",");
				}
			};
            
            /*
			 * Creates base cron configuration -> * * * * * *
			 */
            function createBaseCron(){
                for(var i=0; i<6; i++){
					self.aCron[i] = '*';
				}
            };
            
            /*
			 * Modify schedule module and generate final cron task string
			 */
            function generateCron(){
				$scope.schedule = self.aCron.join(" ");
				return $scope.schedule;
            };
            
            /*
			 * Generate custom cron type
			 * Gets custom value of custom value and generates cron task string
			 */
            function generateCustomCron(){
				var auxCron = $scope.cron.custom.value.split(" ");
				
				if(auxCron.length <= 6)
					self.aCron = auxCron;
				
				$scope.cron.custom.value = this.generateCron();
			};
            
			/*
			 * Generate hourminute cron type
			 *  Create base configuration
			 *  Generates cron task string depending on type selected (hour(s)/minute(s))
			 */
            function generateHourMinuteCron(){
				this.createBaseCron();
				
				if($scope.cron.hourminute.type.value === "minute"){
					self.aCron[0] = $scope.cron.hourminute.subValue2.value;
					self.aCron[1] = $scope.cron.hourminute.subValue1.value + "/" + $scope.cron.hourminute.value;
				}else if($scope.cron.hourminute.type.value === "hour"){
					self.aCron[0] = "0";
					self.aCron[1] = $scope.cron.hourminute.subValue2.value;
					self.aCron[2] = $scope.cron.hourminute.subValue1.value + "/" + $scope.cron.hourminute.value;
				}

				$scope.cron.custom.value = this.generateCron();
			}
            
			/*
			 * Generate week cron type
			 *  Create base configuration
			 *  Parse days of week and generate cron task string
			 */
            function generateWeekCron(){
				this.createBaseCron();
				
				self.aCron[0] = "0";
				self.aCron[1] = $scope.cron.week.subValue2.value;
				self.aCron[2] = $scope.cron.week.subValue1.value;
				self.aCron[5] = $scope.cron.week.value.join(",");
				
				if(self.aCron[5] === "") self.aCron[5] = "*";
				
				$scope.cron.custom.value = this.generateCron();
			};
            
            /*
             * Set initial value on $scope.cron.custom.value
             */
            function setInitialCron(initialCron){
                $scope.cron.custom.value = initialCron;
                
        		var found = null;
        		for(regex in self.cronTypeRegex){
        			if(self.cronTypeRegex[regex].exec(initialCron)){
        				if(regex === "hourminute_m"){
        					var minute = initialCron.split(" ")[1].split("/")[1];
        					self.range.minuteincrement.forEach(function(value){
        						if(value === parseFloat(minute,10)){
        							found = regex;
        						}
        					});
        				}else if(regex === "hourminute_h"){
        					var hour = initialCron.split(" ")[2].split("/")[1];
        					self.range.hourincrement.forEach(function(value){
        						if(value === parseFloat(hour,10)){
        							found = regex;
        						}
        					});
        				}
        			}
        		}
        		
        		if(found != null)
        			self.updateModels[found](initialCron.split(" "));
        		else
        			$scope.scheduleType = $scope.radioTypes["1"];
			};
			
		}],
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
        	
            /*
        	 * Checks if is on edit mode (needs scheduleEdit promise)
        	 * scheduleEdit is a promise function that will have schedule string as callback parameter
        	 * and will populate the cron schedule directive asynchronous.
        	 */
        	if(typeof scope.scheduleEdit() !== "undefined"){
        		scope.scheduleEdit().then(function(schedule){
            		controller.setInitialCron(schedule);
        		});
        	}
            
        	// change minute and hour increment range and restart to default first value of the list
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
        	
        	scope.$watchCollection('[cron.hourminute.type,cron.hourminute.value,cron.hourminute.subValue1,cron.hourminute.subValue2]',function(){
        		if(scope.scheduleType === scope.radioTypes["2"])
        			controller.generateHourminuteCron();
        	});

        	scope.$watchCollection('[cron.week.value,cron.week.subValue1,cron.week.subValue2]',function(){
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
            
            var template = '<div style="margin-top:25px"><div style="margin-top:10px"><input type="radio" ng-model="scheduleType" value="custom"><span translate>CRON</span><input type="text" ng-disabled="cron.custom.disabled" ng-model="cron.custom.value" style="margin-left:5px"></input></div><div style="margin-top:10px"><input type="radio" ng-model="scheduleType" value="hourminute"><span translate>Every</span><select ng-model="cron.hourminute.value" ng-disabled="cron.hourminute.disabled" ng-options="o for o in hourminuteRange.value" style="margin-left:5px"></select><select ng-model="cron.hourminute.type" ng-disabled="cron.hourminute.disabled" ng-options="o.name for o in hourminuteRange.type" style="margin-left:5px"></select><span translate>starting at</span><select ng-model="cron.hourminute.subValue1" ng-disabled="cron.hourminute.disabled" ng-options="o.name for o in hourminuteRange.subValue1" style="margin-left:5px"></select><span style="margin-left:5px">:</span><select ng-model="cron.hourminute.subValue2" ng-disabled="cron.hourminute.disabled" ng-options="o.name for o in hourminuteRange.subValue2" style="margin-left:5px"></select></div><div style="margin-top:10px"><input type="radio" ng-model="scheduleType" value="week"><span translate>Weekly</span><select multiple ng-model="cron.week.value" ng-options="day as dayofweekConvert[day] for day in weekRange.value" style="margin-left:5px"></select><span style="margin-left:5px" translate>at</span><select ng-model="cron.week.subValue1" ng-disabled="cron.week.disabled" ng-options="o.name for o in weekRange.subValue1" style="margin-left:5px"></select><span style="margin-left:5px">:</span><select ng-model="cron.week.subValue2" ng-disabled="cron.week.disabled" ng-options="o.name for o in weekRange.subValue2" style="margin-left:5px"></select></div></div>'
            
            element.append($compile(template)(scope));
        }
	};
	
	return sSchedule;
	
}]);
    
})(window,angular);
    