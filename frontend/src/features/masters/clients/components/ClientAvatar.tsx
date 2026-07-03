import { EntityAvatar } from "@/shared/catalog/EntityAvatar"

type ClientAvatarProps = {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md"
  className?: string
}

export function ClientAvatar(props: ClientAvatarProps) {
  return <EntityAvatar {...props} />
}
