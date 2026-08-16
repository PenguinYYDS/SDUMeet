import { CampusCode, City, DistanceTier } from '../enums'

export interface CampusInfo {
  code: CampusCode
  name: string
  shortName: string
  city: City
  lat: number
  lng: number
}

export const CAMPUSES: CampusInfo[] = [
  { code: CampusCode.CENTRAL, name: '中心校区', shortName: '中心', city: City.JINAN, lat: 36.673, lng: 117.053 },
  { code: CampusCode.HONGJIALOU, name: '洪家楼校区', shortName: '洪楼', city: City.JINAN, lat: 36.685, lng: 117.07 },
  { code: CampusCode.BAOTUQUAN, name: '趵突泉校区', shortName: '趵突泉', city: City.JINAN, lat: 36.661, lng: 117.012 },
  { code: CampusCode.QIANFOSHAN, name: '千佛山校区', shortName: '千佛山', city: City.JINAN, lat: 36.645, lng: 117.03 },
  { code: CampusCode.SOFTWARE_PARK, name: '软件园校区', shortName: '软件园', city: City.JINAN, lat: 36.68, lng: 117.138 },
  { code: CampusCode.XINGLONGSHAN, name: '兴隆山校区', shortName: '兴隆山', city: City.JINAN, lat: 36.604, lng: 117.045 },
  { code: CampusCode.QINGDAO, name: '青岛校区', shortName: '青岛', city: City.QINGDAO, lat: 36.36, lng: 120.69 },
  { code: CampusCode.WEIHAI, name: '威海校区', shortName: '威海', city: City.WEIHAI, lat: 37.53, lng: 122.06 },
]

export const CAMPUS_BY_CODE = CAMPUSES.reduce((acc, c) => {
  acc[c.code] = c
  return acc
}, {} as Record<CampusCode, CampusInfo>)

export const CITY_NAMES: Record<City, string> = {
  [City.JINAN]: '济南',
  [City.QINGDAO]: '青岛',
  [City.WEIHAI]: '威海',
}

// 校区间参考距离（km，约等于通勤距离，用于距离档位推导与展示，非精确值）
export const CAMPUS_DISTANCE_KM: Record<CampusCode, Record<CampusCode, number>> = {
  [CampusCode.CENTRAL]: {
    [CampusCode.CENTRAL]: 0, [CampusCode.HONGJIALOU]: 3, [CampusCode.BAOTUQUAN]: 5,
    [CampusCode.QIANFOSHAN]: 5, [CampusCode.SOFTWARE_PARK]: 10, [CampusCode.XINGLONGSHAN]: 13,
    [CampusCode.QINGDAO]: 320, [CampusCode.WEIHAI]: 480,
  },
  [CampusCode.HONGJIALOU]: {
    [CampusCode.CENTRAL]: 3, [CampusCode.HONGJIALOU]: 0, [CampusCode.BAOTUQUAN]: 4,
    [CampusCode.QIANFOSHAN]: 4, [CampusCode.SOFTWARE_PARK]: 7, [CampusCode.XINGLONGSHAN]: 12,
    [CampusCode.QINGDAO]: 315, [CampusCode.WEIHAI]: 475,
  },
  [CampusCode.BAOTUQUAN]: {
    [CampusCode.CENTRAL]: 5, [CampusCode.HONGJIALOU]: 4, [CampusCode.BAOTUQUAN]: 0,
    [CampusCode.QIANFOSHAN]: 2, [CampusCode.SOFTWARE_PARK]: 6, [CampusCode.XINGLONGSHAN]: 9,
    [CampusCode.QINGDAO]: 312, [CampusCode.WEIHAI]: 472,
  },
  [CampusCode.QIANFOSHAN]: {
    [CampusCode.CENTRAL]: 5, [CampusCode.HONGJIALOU]: 4, [CampusCode.BAOTUQUAN]: 2,
    [CampusCode.QIANFOSHAN]: 0, [CampusCode.SOFTWARE_PARK]: 5, [CampusCode.XINGLONGSHAN]: 7,
    [CampusCode.QINGDAO]: 310, [CampusCode.WEIHAI]: 470,
  },
  [CampusCode.SOFTWARE_PARK]: {
    [CampusCode.CENTRAL]: 10, [CampusCode.HONGJIALOU]: 7, [CampusCode.BAOTUQUAN]: 6,
    [CampusCode.QIANFOSHAN]: 5, [CampusCode.SOFTWARE_PARK]: 0, [CampusCode.XINGLONGSHAN]: 8,
    [CampusCode.QINGDAO]: 305, [CampusCode.WEIHAI]: 465,
  },
  [CampusCode.XINGLONGSHAN]: {
    [CampusCode.CENTRAL]: 13, [CampusCode.HONGJIALOU]: 12, [CampusCode.BAOTUQUAN]: 9,
    [CampusCode.QIANFOSHAN]: 7, [CampusCode.SOFTWARE_PARK]: 8, [CampusCode.XINGLONGSHAN]: 0,
    [CampusCode.QINGDAO]: 300, [CampusCode.WEIHAI]: 460,
  },
  [CampusCode.QINGDAO]: {
    [CampusCode.CENTRAL]: 320, [CampusCode.HONGJIALOU]: 315, [CampusCode.BAOTUQUAN]: 312,
    [CampusCode.QIANFOSHAN]: 310, [CampusCode.SOFTWARE_PARK]: 305, [CampusCode.XINGLONGSHAN]: 300,
    [CampusCode.QINGDAO]: 0, [CampusCode.WEIHAI]: 240,
  },
  [CampusCode.WEIHAI]: {
    [CampusCode.CENTRAL]: 480, [CampusCode.HONGJIALOU]: 475, [CampusCode.BAOTUQUAN]: 472,
    [CampusCode.QIANFOSHAN]: 470, [CampusCode.SOFTWARE_PARK]: 465, [CampusCode.XINGLONGSHAN]: 460,
    [CampusCode.QINGDAO]: 240, [CampusCode.WEIHAI]: 0,
  },
}

export function getDistanceKm(a: CampusCode, b: CampusCode): number {
  return CAMPUS_DISTANCE_KM[a][b]
}

export function getDistanceTier(a: CampusCode, b: CampusCode): DistanceTier {
  if (a === b) return DistanceTier.SAME_CAMPUS
  if (CAMPUS_BY_CODE[a].city === CAMPUS_BY_CODE[b].city) return DistanceTier.SAME_CITY
  return DistanceTier.CROSS_CITY
}

export const DISTANCE_TIER_LABELS: Record<DistanceTier, string> = {
  [DistanceTier.SAME_CAMPUS]: '同校区',
  [DistanceTier.SAME_CITY]: '同城跨校区',
  [DistanceTier.CROSS_CITY]: '跨城市',
}
