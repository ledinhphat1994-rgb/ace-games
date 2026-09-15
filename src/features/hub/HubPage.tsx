import { usePhien } from '@/app/phien'
import { CampusHub } from '@/features/hub/CampusHub'

export function HubPage() {
  const { nguoiDung, dangXuat } = usePhien()
  return <CampusHub nguoiDung={nguoiDung} onDangXuat={() => void dangXuat()} />
}
