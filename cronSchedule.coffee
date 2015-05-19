"use strict"

app = angular.module 'CronSchedule',[]
 
    
app.directive simpleCronSchedule, ['$compile', ($compile) ->
                       
    sSchedule =
        restrict: 'AE'
        scope:
            schedule:'=schedule'
            scheduleEdit:'&'
            initialValue:'@'    
        controller:sScheduleController
        link:sScheduleLink
        templateUrl:'simpleCronSchedule.html'
    
    sScheduleController = ($scope,$element,$attrs) ->
        aCron = ["0","0","0","0","0","0"]
        cronDefaultCustomValue = aCron.join(" ")
        
        cronTypeRegex=
            hourminute_m:/^[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*\s\*$/
            hourminute_h:/^[0]\s[0-9]{1,2}\s[0-9]{1,2}\/[0-9]{1,2}\s\*\s\*\s\*$/
            week:/0\s(\d{1,2})\s(\d{1,2})\s\*\s\*\s(.*)/
        
        self = @
        
        @.radioTypes=
            1:"custom"
            2:"hourminute"
            3:"week"
            
        range=
            hour:[]
            hourincrement:[1,2,3,4,6,8,12,24]
            minute:[],
            minuteincrement:[1,2,3,4,5,6,10,12,15,20,30]
            second:[]
            dayofweek:["SUN","MON","TUE","WED","THU","FRI","SAT"]
        
        @.dayofweekConvert=
            "SUN":"SUN"
            "MON":"MON"
            "TUE":"TUE"
            "WED":"WED"
            "THU":"THU"
            "FRI":"FRI"
            "SAT":"SAT"
        
        hourminute=
            types:[
                name:"minute(s)"
                value:"minute",
                    name:"hour(s)"
                    value:"hour"
            ]
        
        ### calculating hour, minute, second ranges ###
        for i in [0...60]
            if(i<24)
                range.hour.push value:i,name:i+"h"
            
            range.minute.push value:i,name:i+" min"
            range.second.push value:i,name:i+" s"
        
        
        
        ### creates base cron configuration * * * * * * ###
        createBaseCtron = ->
            for i in [0..6]
                aCron[i] = '*'
            return
        
        ### modify schedule module and generate final cron task string ###
        generateCron = ->
            self.schedule = aCron.join(" ")
        
        ### Generate custom cron type - Gets custom value of custom value and generates cron task string ###
        generateCustomCron = ->
            auxCron = self.cron.custom.value.split(" ");
            
            if(auxCron.length <= 6) then aCron = auxCron;
            
            cron.custom.value = do(generateCron)
        
        ### 
            Generate hourminute cron type
			 - Create base configuration
			 - Generates cron task string depending on type selected (hour(s)/minute(s))
        ### 
        generateHourminuteCron = ->
            do(createBaseCron)
            if (self.cron.hourminute.type.value is "minute")
                aCron[0] = self.cron.hourminute.subValue2.value
                aCron[1] = self.cron.hourminute.subValue1.value +"/"+ self.cron.hourminute.value
            else if (self.cron.hourminute.type.value is "hour")
                aCron[0] = "0";
                aCron[1] = self.cron.hourminute.subValue2.value
                aCron[2] = self.cron.hourminute.subValue1.value +"/"+ self.cron.hourminute.value
            self.cron.custom.value = do(generateCron)
            
        ###
        Generate week cron type
			 - Create base configuration
			 - Parse days of week and generate cron task string
        ###
        generateWeekCron = ->
            do(createBaseCron)
            
            aCron[0] = "0"
            aCron[1] = self.cron.week.subValue2.value
            aCron[2] = self.cron.week.subValue1.value
            aCron[5] = self.cron.week.value.join(",")
            
            if(aCron[5] is "") then aCron[5] = "*"
            
            self.cron.custom.value = do(generateCron)
        
        ###
            Update models that have information about the cron task based on cron type (hourminute_m, hourminute_h, week)
            every time that update the scheduleType, it generates cron task string, check watch('scheduleType',...) function
        ###
        updateModels = ->
            'hourminute_m': ->
                self.scheduleType = self.radioTypes["2"]
                self.cron.hourminute.type = self.hourminute.types[0]
                
                $timeout -> 
                    self.hourminuteRange.value     = range.minuteincrement
                    self.hourminuteRange.subValue1 = range.minute
                    self.hourminuteRange.subValue2 = range.second
                    
                    self.cron.hourminute.subValue2 = range.second[parseFloat(schedule[0],10)]
                    subschedule = schedule[1].split("/")
                    
                    self.cron.hourminute.subValue1 = range.minute[parseFloat(subschedule[0],10)]
                    self.cron.hourminute.value = parseFloat(subschedule[1],10)
                    
                    $scope.$apply();
                return
            
            'hourminute_h': ->
                self.scheduleType = self.radioTypes["2"]
                self.cron.hourminute.type = hourminute.types[1]
                
                $timeout ->
                    self.hourminuteRange.value     = range.hourincrement
                    self.hourminuteRange.subValue1 = range.hour
                    self.hourminuteRange.subValue2 = range.minute
                    
                    self.cron.hourminute.subValue2 = range.minute[parseFloat(schedule[1],10)]
                    subschedule = schedule[2].split("/")
                    
                    self.cron.hourminute.subValue1 = range.hour[parseFloat(subschedule[0],10)]
                    self.cron.hourminute.value     = parseFloat(subschedule[1],10)
                    $scope.$apply()
                return
            
            'week': (schedule)->
                self.scheduleType = self.radioTypes[3]
                
                self.cron.week.subValue2 = range.minute[parseFloat(schedule[1],10)]
                self.cron.week.subValue1 = range.hour[parseFloat(schedule[2],10)]
                
                self.cron.week.value = schedule[5].split(",")
        
        ###
        Always update cron custom value and also populate the models
        ###
        setInitialCron = (initialCron) ->
            
            self.cron.custom.value = initialCron
            for regex in cronTypeRegex
                do(regex) ->
                    if(cronTypeRegex[regex].exec(initialCron))
                       updateModels.regex(initialCron.split(" "))
            return
        
        return
    
    sSchedule
]