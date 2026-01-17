import { Detail, ActionPanel, Action, Icon } from '@raycast/api'
import { getFuzzyTimeFormatted } from './utils/fuzzyTime'

export default function FuzzyClockView() {
  const fuzzyTime = getFuzzyTimeFormatted(new Date(), true)

  return (
    <Detail
      markdown={`# ${fuzzyTime}`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Fuzzy Time"
            content={fuzzyTime}
            icon={Icon.Clipboard}
          />
        </ActionPanel>
      }
    />
  )
}
