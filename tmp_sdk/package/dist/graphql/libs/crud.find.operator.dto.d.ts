import { MatchScalarExpressionEnum } from './crud.enum.js';

type MatchScalarFnArgs = Record<string, unknown>;
declare class MatchScalarDto {
    fn: MatchScalarExpressionEnum;
    args?: MatchScalarFnArgs;
}
declare class FindOperatorDto {
    equal?: string;
    notEqual?: string;
    like?: string;
    notLike?: string;
    into?: string[];
    notInto?: string[];
    between?: string[];
    notBetween?: string[];
    lt?: string;
    lte?: string;
    mt?: string;
    mte?: string;
    nulls?: boolean;
    matchScalar?: MatchScalarDto;
}

export { FindOperatorDto, MatchScalarDto, type MatchScalarFnArgs };
