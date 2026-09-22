import { AccountQuickCenter, type AccountQuickCenterProps } from './account/AccountQuickCenter'

export type UserAvatarMenuProps = AccountQuickCenterProps

export function UserAvatarMenu(props: UserAvatarMenuProps) {
  return <AccountQuickCenter {...props} />
}
