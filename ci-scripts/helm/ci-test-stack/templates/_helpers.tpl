{{/*
Common labels
*/}}
{{- define "ci-test-stack.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Console app name
*/}}
{{- define "ci-test-stack.consoleName" -}}
{{ .Release.Name }}-console
{{- end }}

{{/*
Plugin app name
*/}}
{{- define "ci-test-stack.pluginName" -}}
{{ .Release.Name }}-plugin
{{- end }}

{{/*
Console service account name
*/}}
{{- define "ci-test-stack.consoleSAName" -}}
{{ .Release.Name }}-console
{{- end }}
