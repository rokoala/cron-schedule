"use strict"

app = angular.module 'CronSchedule',[]
 
    
app.directive "simpleCronSchedule", ['$compile', ($compile) ->
    
    sScheduleController = ($scope,$element,$attrs) ->
        aCron = ["0","0","0","0","0","0"]
        @.cronDefaultCustomValue = aCron.join(" ")
            
        cronTypeRegex=
            hourminute_m:/^[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*\s\*$/
            hourminute_h:/^[0]\s[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*$/
            week:/0\s(\d{1,2})\s(\d{1,2})\s\*\s\*\s(.*)/
        
        self = @
        
        $scope.radioTypes=
            1:"custom"
            2:"hourminute"
            3:"week"
            
        @.range=
            hour:[]
            hourincrement:[1,2,3,4,6,8,12,24]
            minute:[],
            minuteincrement:[1,2,3,4,5,6,10,12,15,20,30]
            second:[]
            dayofweek:["SUN","MON","TUE","WED","THU","FRI","SAT"]
        
        $scope.dayofweekConvert=
            "SUN":"SUN"
            "MON":"MON"
            "TUE":"TUE"
            "WED":"WED"
            "THU":"THU"
            "FRI":"FRI"
            "SAT":"SAT"
        
        @.hourminute=
            types:[
                name:"minute(s)"
                value:"minute",
                    name:"hour(s)"
                    value:"hour"
            ]
        
        ### calculating hour, minute, second ranges ###
        for i in [0...60]
            if(i<24)
                self.range.hour.push value:i,name:i+"h"
            
            self.range.minute.push value:i,name:i+" min"
            self.range.second.push value:i,name:i+" s"
        
        
        
        ### creates base cron configuration * * * * * * ###
        createBaseCron = ->
            for i in [0..6]
                aCron[i] = '*'
            return
        
        ### modify schedule module and generate final cron task string ###
        generateCron = ->
            $scope.schedule = aCron.join(" ")
            return
        
        ### Generate custom cron type - Gets custom value of custom value and generates cron task string ###
        @.generateCustomCron = ->
            auxCron = $scope.cron.custom.value.split(" ");
            
            if(auxCron.length <= 6) then aCron = auxCron;
            
            $scope.cron.custom.value = do(generateCron)
            return
        
        ### 
            Generate hourminute cron type
			 - Create base configuration
			 - Generates cron task string depending on type selected (hour(s)/minute(s))
        ### 
        @.generateHourminuteCron = ->
            do(createBaseCron)
            if ($scope.cron.hourminute.type.value is "minute")
                aCron[0] = $scope.cron.hourminute.subValue2.value
                aCron[1] = $scope.cron.hourminute.subValue1.value+"/"+$scope.cron.hourminute.value
            else if ($scope.cron.hourminute.type.value is "hour")
                aCron[0] = "0";
                aCron[1] = $scope.cron.hourminute.subValue2.value
                aCron[2] = $scope.cron.hourminute.subValue1.value+"/"+$scope.cron.hourminute.value
            $scope.cron.custom.value = do(generateCron)
            return
            
        ###
        Generate week cron type
			 - Create base configuration
			 - Parse days of week and generate cron task string
        ###
        @.generateWeekCron = ->
            do(createBaseCron)
            
            aCron[0] = "0"
            aCron[1] = $scope.cron.week.subValue2.value
            aCron[2] = $scope.cron.week.subValue1.value
            aCron[5] = $scope.cron.week.value.join(",")
            
            if(aCron[5] is "") then aCron[5] = "*"
            
            $scope.cron.custom.value = do(generateCron)
            return
        
        ###
            Update models that have information about the cron task based on cron type (hourminute_m, hourminute_h, week)
            every time that update the scheduleType, it generates cron task string, check watch('scheduleType',...) function
        ###
        updateModels = ->
            'hourminute_m': ->
                $scope.scheduleType = $scope.radioTypes["2"]
                $scope.cron.hourminute.type = self.hourminute.types[0]
                
                $timeout -> 
                    $scope.hourminuteRange.value     = self.range.minuteincrement
                    $scope.hourminuteRange.subValue1 = self.range.minute
                    $scope.hourminuteRange.subValue2 = self.range.second
                    
                    $scope.cron.hourminute.subValue2 = self.range.second[parseFloat(schedule[0],10)]
                    subschedule = schedule[1].split("/")
                    
                    $scope.cron.hourminute.subValue1 = self.range.minute[parseFloat(subschedule[0],10)]
                    $scope.cron.hourminute.value = parseFloat(subschedule[1],10)
                    
                    $scope.$apply();
                return
            
            'hourminute_h': ->
                $scope.scheduleType = $scope.radioTypes["2"]
                $scope.cron.hourminute.type = self.hourminute.types[1]
                
                $timeout ->
                    $scope.hourminuteRange.value     = self.range.hourincrement
                    $scope.hourminuteRange.subValue1 = self.range.hour
                    $scope.hourminuteRange.subValue2 = self.range.minute
                    
                    $scope.cron.hourminute.subValue2 = self.range.minute[parseFloat(schedule[1],10)]
                    subschedule = schedule[2].split("/")
                    
                    $scope.cron.hourminute.subValue1 = self.range.hour[parseFloat(subschedule[0],10)]
                    $scope.cron.hourminute.value     = parseFloat(subschedule[1],10)
                    $scope.$apply()
                return
            
            'week': (schedule)->
                $scope.scheduleType = $scope.radioTypes[3]
                
                $scope.cron.week.subValue2 = self.range.minute[parseFloat(schedule[1],10)]
                $scope.cron.week.subValue1 = self.range.hour[parseFloat(schedule[2],10)]
                
                $scope.cron.week.value = schedule[5].split(",")
        
        ###
        Always update cron custom value and also populate the models
        ###
        @.setInitialCron = (initialCron) ->
            
            $scope.cron.custom.value = initialCron
            for regex in cronTypeRegex
                do(regex) ->
                    if(cronTypeRegex[regex].exec(initialCron))
                       updateModels.regex(initialCron.split(" "))
            return
        
        return
        
    sScheduleLink = (scope, element, attrs, controller) ->
        scope.schedule = controller.cronDefaultCustomValue
        
        scope.scheduleType = "custom"
        
        scope.hourminuteRange =
            value:controller.range.minuteincrement
            type:controller.hourminute.types
            subValue1:controller.range.minute
            subValue2:controller.range.second
        
        scope.weekRange = 
            value:controller.range.dayofweek
            subValue1:controller.range.hour
            subValue2:controller.range.minute
        
        scope.cron = 
            custom:
                disabled:false
                value:controller.cronDefaultCustomValue
            hourminute:
                disabled:true,
                value:1,
                type:controller.hourminute.types[0],
                subValue1:controller.range.minute[0],
                subValue2:controller.range.second[0]
            week:
                disabled:true,
                value:[],
                subValue1:controller.range.hour[0],
                subValue2:controller.range.minute[0]
        
        if scope.initalValue?
            controller.setInitialCron(scope.initialValue)
            
        scope.$watch 'cron.hourminute.type', (newValue,oldValue) ->
            if(newValue isnt oldValue)
                switch(newValue.value)
                    when "minute"
                        scope.hourminuteRange.value=controller.range.minuteincrement;
                        scope.cron.hourminute.value=controller.range.minuteincrement[0];

                        scope.hourminuteRange.subValue1=controller.range.minute;
                        scope.cron.hourminute.subValue1=controller.range.minute[0];

                        scope.hourminuteRange.subValue2=controller.range.second;
                        scope.cron.hourminute.subValue2=controller.range.second[0];
                        return
                    when "hour"
                        scope.hourminuteRange.value=controller.range.hourincrement;
                        scope.cron.hourminute.value=controller.range.hourincrement[0];

                        scope.hourminuteRange.subValue1=controller.range.hour;
                        scope.cron.hourminute.subValue1=controller.range.hour[0];

                        scope.hourminuteRange.subValue2=controller.range.minute;
                        scope.cron.hourminute.subValue2=controller.range.minute[0];
                        return
                
        scope.$watch 'cron.custom.value', (newValue,oldValue) ->
            if(newValue isnt oldValue)
                if(scope.scheduleType is scope.radioTypes["1"])
                    do(controller.generateCustomCron)
            return
        
        scope.$watchCollection '[cron.hourminute.type,cron.hourminute.value,cron.hourminute.subValue1,cron.hourminute.subValue2]',(newValues,oldValues) ->
            if(scope.scheduleType is scope.radioTypes["2"])
                controller.generateWeekCron()
            return
                    
        scope.$watchCollection '[cron.week.value,cron.week.subValue1,cron.week.subValue2]',(newValues,oldValues) ->
            if(scope.scheduleType is scope.radioTypes["3"])
                controller.generateWeekCron()
            return
        
        scope.$watch 'scheduleType', (newValue,oldValue) ->
            if newValue isnt oldValue
                for type in scope.radioTypes
                    do(type)->
                        scope.cron[scope.radioTypes[type]].disabled=true

                scope.cron[newValue].disabled=false

                if (newValue is scope.radioTypes["1"])
                    controller.generateCustomCron()
                else if(newValue is scope.radioTypes["2"])
                    controller.generateHourminuteCron()
                else if(newValue is scope.radioTypes["3"])
                    controller.generateWeekCron()
        
        if scope.scheduleEdit()
            do(scope.scheduleEdit).then( (schedule)->
                controller.setInitialCron(schedule)
            )

    sSchedule =
        restrict: 'AE'
        scope:
            schedule:'=schedule'
            scheduleEdit:'&'
            initialValue:'@'    
        controller:sScheduleController
        link:sScheduleLink
        templateUrl:'simpleCronSchedule.html'    
    
    sSchedule
]