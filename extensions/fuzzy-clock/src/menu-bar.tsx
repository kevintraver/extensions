import {
  MenuBarExtra,
  openCommandPreferences,
  getPreferenceValues,
  Icon
} from '@raycast/api'
import { getFuzzyTimeFormatted } from './utils/fuzzyTime'

interface Preferences {
  showIcon: boolean
  capitalizeFirst: boolean
}

export default function FuzzyClockMenuBar() {
  const { showIcon, capitalizeFirst } = getPreferenceValues<Preferences>()
  const now = new Date()
  const fuzzyTime = getFuzzyTimeFormatted(now, capitalizeFirst)
  const exactTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <MenuBarExtra
      icon={showIcon ? Icon.Clock : undefined}
      title={fuzzyTime}
      tooltip="Fuzzy Clock"
    >
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title={exactTime} />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Configure"
          icon={Icon.Gear}
          shortcut={{ modifiers: ['cmd'], key: ',' }}
          onAction={openCommandPreferences}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  )
}
