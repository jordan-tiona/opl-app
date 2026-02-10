import { getMatchWeight } from '~/lib/utils'

describe('getMatchWeight', () => {
    it('returns [8, 8] for equal ratings', () => {
        expect(getMatchWeight(600, 600)).toEqual([8, 8])
    })

    it('returns [8, 8] for difference <= 50', () => {
        expect(getMatchWeight(650, 600)).toEqual([8, 8])
        expect(getMatchWeight(600, 650)).toEqual([8, 8])
    })

    it('returns [8, 7] for difference 51-100', () => {
        expect(getMatchWeight(700, 600)).toEqual([8, 7])
    })

    it('assigns higher weight to higher-rated player', () => {
        // Player 1 higher rated
        expect(getMatchWeight(700, 600)).toEqual([8, 7])
        // Player 2 higher rated — weights are swapped
        expect(getMatchWeight(600, 700)).toEqual([7, 8])
    })

    it('returns [9, 7] for difference 101-150', () => {
        expect(getMatchWeight(750, 600)).toEqual([9, 7])
    })

    it('returns [9, 6] for difference 151-200', () => {
        expect(getMatchWeight(800, 600)).toEqual([9, 6])
    })

    it('returns [10, 6] for difference 201-250', () => {
        expect(getMatchWeight(850, 600)).toEqual([10, 6])
    })

    it('returns [10, 5] for difference 251-300', () => {
        expect(getMatchWeight(900, 600)).toEqual([10, 5])
    })

    it('returns [11, 5] for difference 301-350', () => {
        expect(getMatchWeight(950, 600)).toEqual([11, 5])
    })

    it('returns [11, 4] for difference 351-400', () => {
        expect(getMatchWeight(1000, 600)).toEqual([11, 4])
    })

    it('returns [12, 4] for difference > 400', () => {
        expect(getMatchWeight(1100, 600)).toEqual([12, 4])
    })
})
