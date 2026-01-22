declare module '@garmin/fitsdk' {
    /**
     * Stream class for handling FIT file data.
     */
    export class Stream {
        static fromByteArray(data: number[]): Stream;
        static fromBuffer(buffer: any): Stream;
        static fromArrayBuffer(arrayBuffer: ArrayBuffer): Stream;

        constructor(arrayBuffer: ArrayBuffer);

        readonly length: number;
        readonly bytesRead: number;
        readonly position: number;

        reset(): void;
        seek(position: number): void;
        slice(begin: number, end: number): ArrayBuffer;
        peekByte(): number;
        readByte(): number;
        readBytes(size: number): Uint8Array;
    }

    export interface DecoderReadOptions {
        /**
         * Optional callback function that can be used to inspect or manipulate messages after they are fully decoded 
         * and all the options have been applied. 
         * The message is mutable and we be returned from the Read method in the messages dictionary.
         * 
         * @param mesgNum 
         * @param message
         */
        mesgListener?: (mesgNum: number, message: any) => void;

        /**
         * Optional callback function that can be used to inspect message defintions as they are decoded from the file.
         * @param messageDefinition 
         */
        mesgDefinitionListener?: (messageDefinition: any) => void;

        /**
         * Optional callback function that can be used to inspect developer field descriptions as they are decoded from the file.
         * @param key 
         * @param developerDataIdMesg 
         * @param fieldDescriptionMesg 
         */ 
        fieldDescriptionListener?: (key: number, developerDataIdMesg: any, fieldDescriptionMesg: any) => void;

        /**
         * When true subfields are created for fields as defined in the FIT Profile.
         * 
         * @example 
         * ```js
         * {
         *  event: 'rearGearChange',
         *  data: 16717829,
         *  gearChangeData:16717829 // Sub Field of data when event == 'rearGearChange'
         * }
         * ```
         * 
         * When false subfields are omitted.
         * 
         * @example 
         * ```js
         * {
         *  event: 'rearGearChange',
         *  data: 16717829
         * }
         * ```
         */
        expandSubFields?: boolean;

        /**
         * When true field components as defined in the FIT Profile are expanded into new fields. 
         * expandSubFields must be set to true in order for subfields to be expanded.
         * 
         * @example
         * ```js
         * {
         *  event: 'rearGearChange',
         *  data: 16717829,
         *  gearChangeData:16717829, // Sub Field of data when event == 'rearGearChange
         *  frontGear: 2, // Expanded field of gearChangeData, bits 0-7
         *  frontGearNum: 53, // Expanded field of gearChangeData, bits 8-15
         *  rearGear: 11, // Expanded field of gearChangeData, bits 16-23
         *  rearGearNum: 1, // Expanded field of gearChangeData, bits 24-31
         * }
         * ```
         * 
         * When false field components are not expanded.
         * @example
         * ```js
         * {
         *  event: 'rearGearChange',
         *  data: 16717829,
         *  gearChangeData: 16717829 // Sub Field of data when event == 'rearGearChange
         * }
         * ```
         */
        expandComponents?: boolean;

        /**
         * When true the scale and offset values as defined in the FIT Profile are applied to the raw field values.
         */
        applyScaleAndOffset?: boolean;

        /**
         * When true field values are converted from raw integer values to the corresponding string values as defined in the FIT Profile.
         * 
         * @example
         * ```js
         * { type:'activity'}
         * ```
         * 
         * When false the raw integer value is used.
         * 
         * @example 
         * ```js
         * { type: 4 }
         * ```
         */
        convertTypesToStrings?: boolean;

        /**
         * When true FIT Epoch values are converted to JavaScript Date objects.
         */
        convertDateTimesToDates?: boolean;

        /**
         * When true unknown field values are stored in the message using the field id as the key.
         * 
         * @example 
         * ```js
         * { 249: 123 } // Unknown field with an id of 249
         * ```  
         */
        includeUnknownData?: boolean;

        /**
         * When true automatically merge heart rate values from HR messages into the Record messages. 
         * This option requires the applyScaleAndOffset and expandComponents options to be enabled. 
         * This option has no effect on the Record messages when no HR messages are present in the decoded messages.
         */
        mergeHeartRates?: boolean;


        decodeMemoGlobs?: boolean;
        skipHeader?: boolean;
        dataOnly?: boolean;
    }

    export interface FileIdMesg {
        serialNumber?: number;
        timeCreated?: Date;
        manufacturer?: string | number;
        product?: number;
        type?: string;
        garminProduct?: string | number;
        [key: string]: any;
    }

    export interface FileCreatorMesg {
        softwareVersion?: number;
        hardwareVersion?: number;
        [key: string]: any;
    }

    export interface ActivityMesg {
        timestamp?: Date;
        totalTimerTime?: number;
        localTimestamp?: number;
        numSessions?: number;
        type?: string;
        event?: string;
        eventType?: string;
        [key: string]: any;
    }

    export interface SessionMesg {
        timestamp?: Date;
        startTime?: Date;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        totalCycles?: number;
        sportProfileName?: string;
        enhancedAvgSpeed?: number;
        trainingLoadPeak?: number;
        messageIndex?: number;
        totalCalories?: number;
        avgSpeed?: number;
        maxSpeed?: number;
        firstLapIndex?: number;
        numLaps?: number;
        enhancedAvgRespirationRate?: number;
        enhancedMaxRespirationRate?: number;
        enhancedMinRespirationRate?: number;
        event?: string;
        eventType?: string;
        sport?: string;
        subSport?: string;
        avgHeartRate?: number;
        maxHeartRate?: number;
        totalTrainingEffect?: number;
        trigger?: string;
        totalAnaerobicTrainingEffect?: number;
        avgRespirationRate?: number;
        maxRespirationRate?: number;
        minRespirationRate?: number;
        [key: string]: any;
    }

    export interface RecordMesg {
        timestamp?: Date;
        distance?: number;
        heartRate?: number;
        enhancedRespirationRate?: number;
        positionLat?: number;
        positionLong?: number;
        altitude?: number;
        speed?: number;
        power?: number;
        cadence?: number;
        [key: string]: any;
    }

    export interface EventMesg {
        timestamp?: Date;
        data?: number;
        event?: string;
        eventType?: string;
        eventGroup?: number;
        timerTrigger?: string;
        [key: string]: any;
    }

    export interface DeviceInfoMesg {
        timestamp?: Date;
        serialNumber?: number;
        manufacturer?: string | number;
        product?: number;
        softwareVersion?: number;
        deviceIndex?: number | string;
        sourceType?: string;
        garminProduct?: string | number;
        batteryVoltage?: number;
        deviceType?: number;
        hardwareVersion?: number;
        batteryStatus?: string;
        antNetwork?: string;
        antplusDeviceType?: string;
        [key: string]: any;
    }

    export interface UserProfileMesg {
        wakeTime?: number;
        sleepTime?: number;
        weight?: number;
        gender?: string;
        height?: number;
        language?: string;
        elevSetting?: string;
        weightSetting?: string;
        restingHeartRate?: number;
        hrSetting?: string;
        speedSetting?: string;
        distSetting?: string;
        activityClass?: number;
        positionSetting?: string;
        temperatureSetting?: string;
        heightSetting?: string;
        [key: string]: any;
    }

    export interface SetMesg {
        timestamp?: Date;
        duration?: number;
        startTime?: Date;
        repetitions?: number;
        weight?: number;
        category?: string[];
        categorySubtype?: (number | null)[];
        messageIndex?: number;
        setType?: string;
        [key: string]: any;
    }

    export interface TimeInZoneMesg {
        timestamp?: Date;
        timeInHrZone?: number[];
        timeInSpeedZone?: number[];
        timeInCadenceZone?: number[];
        timeInPowerZone?: number[];
        referenceMesg?: string;
        referenceIndex?: number;
        hrZoneHighBoundary?: number[];
        speedZoneHighBoundary?: number[];
        cadenceZoneHighBondary?: number[]; // typo in profile.js? kept as is or checked
        powerZoneHighBoundary?: number[];
        hrCalcType?: string;
        maxHeartRate?: number;
        restingHeartRate?: number;
        thresholdHeartRate?: number;
        pwrCalcType?: string;
        functionalThresholdPower?: number;
        [key: string]: any;
    }

    export interface SportMesg {
        name?: string;
        sport?: string;
        subSport?: string;
        [key: string]: any;
    }

    export interface TrainingSettingsMesg {
        targetDistance?: number;
        targetSpeed?: number;
        targetTime?: number;
        preciseTargetSpeed?: number;
        [key: string]: any;
    }

    export interface ZonesTargetMesg {
        maxHeartRate?: number;
        thresholdHeartRate?: number;
        functionalThresholdPower?: number;
        hrCalcType?: string;
        pwrCalcType?: string;
        [key: string]: any;
    }

    export interface DeviceSettingsMesg {
        activeTimeZone?: number;
        utcOffset?: number;
        timeOffset?: number[];
        timeMode?: string[];
        timeZoneOffset?: number[];
        backlightMode?: string;
        activityTrackerEnabled?: boolean;
        clockTime?: Date;
        pagesEnabled?: number[];
        moveAlertEnabled?: boolean;
        dateMode?: string;
        displayOrientation?: string;
        mountingSide?: string;
        defaultPage?: number[];
        autosyncMinSteps?: number;
        autosyncMinTime?: number;
        lactateThresholdAutodetectEnabled?: boolean;
        bleAutoUploadEnabled?: boolean;
        autoSyncFrequency?: string;
        autoActivityDetect?: number;
        numberOfScreens?: number;
        smartNotificationDisplayOrientation?: string;
        tapInterface?: string;
        tapSensitivity?: string;
        [key: string]: any;
    }

    export interface TimestampCorrelationMesg {
        timestamp?: Date;
        fractionalTimestamp?: number;
        systemTimestamp?: Date;
        fractionalSystemTimestamp?: number;
        localTimestamp?: number;
        timestampMs?: number;
        systemTimestampMs?: number;
        [key: string]: any;
    }

    export interface DecoderReadResult {
        messages: {
            fileIdMesgs?: FileIdMesg[];
            fileCreatorMesgs?: FileCreatorMesg[];
            timestampCorrelationMesgs?: TimestampCorrelationMesg[];
            softwareMesgs?: any[];
            slaveDeviceMesgs?: any[];
            capabilitiesMesgs?: any[];
            fileCapabilitiesMesgs?: any[];
            mesgCapabilitiesMesgs?: any[];
            fieldCapabilitiesMesgs?: any[];
            deviceSettingsMesgs?: DeviceSettingsMesg[];
            userProfileMesgs?: UserProfileMesg[];
            hrmProfileMesgs?: any[];
            sdmProfileMesgs?: any[];
            bikeProfileMesgs?: any[];
            connectivityMesgs?: any[];
            watchfaceSettingsMesgs?: any[];
            ohrSettingsMesgs?: any[];
            timeInZoneMesgs?: TimeInZoneMesg[];
            zonesTargetMesgs?: ZonesTargetMesg[];
            sportMesgs?: SportMesg[];
            hrZoneMesgs?: any[];
            speedZoneMesgs?: any[];
            cadenceZoneMesgs?: any[];
            powerZoneMesgs?: any[];
            metZoneMesgs?: any[];
            trainingSettingsMesgs?: TrainingSettingsMesg[];
            diveSettingsMesgs?: any[];
            diveAlarmMesgs?: any[];
            diveApneaAlarmMesgs?: any[];
            diveGasMesgs?: any[];
            goalMesgs?: any[];
            activityMesgs?: ActivityMesg[];
            sessionMesgs?: SessionMesg[];
            lapMesgs?: any[];
            lengthMesgs?: any[];
            recordMesgs?: RecordMesg[];
            eventMesgs?: EventMesg[];
            deviceInfoMesgs?: DeviceInfoMesg[];
            deviceAuxBatteryInfoMesgs?: any[];
            trainingFileMesgs?: any[];
            weatherConditionsMesgs?: any[];
            weatherAlertMesgs?: any[];
            gpsMetadataMesgs?: any[];
            cameraEventMesgs?: any[];
            gyroscopeDataMesgs?: any[];
            accelerometerDataMesgs?: any[];
            magnetometerDataMesgs?: any[];
            barometerDataMesgs?: any[];
            threeDSensorCalibrationMesgs?: any[];
            oneDSensorCalibrationMesgs?: any[];
            videoFrameMesgs?: any[];
            obdiiDataMesgs?: any[];
            nmeaSentenceMesgs?: any[];
            aviationAttitudeMesgs?: any[];
            videoMesgs?: any[];
            videoTitleMesgs?: any[];
            videoDescriptionMesgs?: any[];
            videoClipMesgs?: any[];
            setMesgs?: SetMesg[];
            jumpMesgs?: any[];
            splitMesgs?: any[];
            splitSummaryMesgs?: any[];
            climbProMesgs?: any[];
            fieldDescriptionMesgs?: any[];
            developerDataIdMesgs?: any[];
            courseMesgs?: any[];
            coursePointMesgs?: any[];
            segmentIdMesgs?: any[];
            segmentLeaderboardEntryMesgs?: any[];
            segmentPointMesgs?: any[];
            segmentLapMesgs?: any[];
            segmentFileMesgs?: any[];
            workoutMesgs?: any[];
            workoutSessionMesgs?: any[];
            workoutStepMesgs?: any[];
            exerciseTitleMesgs?: any[];
            scheduleMesgs?: any[];
            totalsMesgs?: any[];
            weightScaleMesgs?: any[];
            bloodPressureMesgs?: any[];
            monitoringInfoMesgs?: any[];
            monitoringMesgs?: any[];
            monitoringHrDataMesgs?: any[];
            spo2DataMesgs?: any[];
            hrMesgs?: any[];
            stressLevelMesgs?: any[];
            maxMetDataMesgs?: any[];
            hsaBodyBatteryDataMesgs?: any[];
            hsaEventMesgs?: any[];
            hsaAccelerometerDataMesgs?: any[];
            hsaGyroscopeDataMesgs?: any[];
            hsaStepDataMesgs?: any[];
            hsaSpo2DataMesgs?: any[];
            hsaStressDataMesgs?: any[];
            hsaRespirationDataMesgs?: any[];
            hsaHeartRateDataMesgs?: any[];
            hsaConfigurationDataMesgs?: any[];
            hsaWristTemperatureDataMesgs?: any[];
            memoGlobMesgs?: any[];
            sleepLevelMesgs?: any[];
            antChannelIdMesgs?: any[];
            antRxMesgs?: any[];
            antTxMesgs?: any[];
            exdScreenConfigurationMesgs?: any[];
            exdDataFieldConfigurationMesgs?: any[];
            exdDataConceptConfigurationMesgs?: any[];
            diveSummaryMesgs?: any[];
            aadAccelFeaturesMesgs?: any[];
            hrvMesgs?: any[];
            beatIntervalsMesgs?: any[];
            hrvStatusSummaryMesgs?: any[];
            hrvValueMesgs?: any[];
            rawBbiMesgs?: any[];
            respirationRateMesgs?: any[];
            chronoShotSessionMesgs?: any[];
            chronoShotDataMesgs?: any[];
            tankUpdateMesgs?: any[];
            tankSummaryMesgs?: any[];
            sleepAssessmentMesgs?: any[];
            sleepDisruptionSeverityPeriodMesgs?: any[];
            sleepDisruptionOvernightSeverityMesgs?: any[];
            skinTempOvernightMesgs?: any[];
            padMesgs?: any[];
            
            // Catch-all
            [key: string]: any[];
        };
        errors: Error[];
        profileVersion?: any;
    }

    /**
     * Decoder class for parsing FIT files.
     */
    export class Decoder {
        constructor(stream: Stream);

        static isFIT(stream: Stream): boolean;
        isFIT(): boolean;
        checkIntegrity(): boolean;
        
        read(options?: DecoderReadOptions): DecoderReadResult;
    }

    export class Encoder {
        // Placeholder for Encoder
    }

    export class CrcCalculator {
        // Placeholder for CrcCalculator
    }

    export const Profile: {
        version: {
            major: number;
            minor: number;
            patch: number;
            type: string;
        };
        CommonFields: {
            PartIndex: number;
            Timestamp: number;
            MessageIndex: number;
        };
        MesgNum: Record<string, number>;
        messages: Record<number, {
            num: number;
            name: string;
            messagesKey: string;
            fields: Record<number, any>;
        }>;
        types: Record<number, Record<number | string, string | number>>;
        [key: string]: any;
    };

    export const Utils: {
        FIT_EPOCH_MS: number;
        convertDateTimeToDate(datetime: number): Date;
        convertDateToDateTime(date: Date): number;
        FitBaseType: any;
        BaseTypeToFieldType: any;
        FieldTypeToBaseType: any;
    };
}
