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
        mesgListener?: (mesgNum: number, message: any) => void;
        mesgDefinitionListener?: (messageDefinition: any) => void;
        fieldDescriptionListener?: (key: number, developerDataIdMesg: any, fieldDescriptionMesg: any) => void;
        expandSubFields?: boolean;
        expandComponents?: boolean;
        applyScaleAndOffset?: boolean;
        convertTypesToStrings?: boolean;
        convertDateTimesToDates?: boolean;
        includeUnknownData?: boolean;
        mergeHeartRates?: boolean;
        decodeMemoGlobs?: boolean;
        skipHeader?: boolean;
        dataOnly?: boolean;
    }

    export interface DecoderReadResult {
        messages: {
            fileIdMesgs?: any[];
            fileCreatorMesgs?: any[];
            softwareMesgs?: any[];
            slaveDeviceMesgs?: any[];
            capabilitiesMesgs?: any[];
            fileCapabilitiesMesgs?: any[];
            mesgCapabilitiesMesgs?: any[];
            fieldCapabilitiesMesgs?: any[];
            
            // Common Data Messages
            recordMesgs?: any[];
            sessionMesgs?: any[];
            lapMesgs?: any[];
            deviceInfoMesgs?: any[];
            sportMesgs?: any[];
            activityMesgs?: any[];
            setMesgs?: any[]; // Strength training sets
            
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
        MesgNum: Record<string, number>;
        messages: Record<number, any>;
        types: Record<number, any>;
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
