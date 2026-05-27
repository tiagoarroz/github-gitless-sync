import * as React from "react";
import { ConflictFile, ConflictResolution } from "src/sync-manager";
import DiffView from "./diff-view";

const UnifiedView = ({
  initialFiles,
  onResolveAllConflicts,
}: {
  initialFiles: ConflictFile[];
  onResolveAllConflicts: (resolutions: ConflictResolution[]) => void;
}) => {
  const [files, setFiles] = React.useState(initialFiles);
  const [resolvedConflicts, setResolvedConflicts] = React.useState<
    ConflictResolution[]
  >([]);

  const resolveAllWithSource = (source: "remote" | "local") => {
    // Mantém as resoluções já feitas manualmente e resolve os conflitos restantes
    // com a fonte selecionada no topo da janela.
    const remainingResolutions = files.map((file) => ({
      filePath: file.filePath,
      content: source === "remote" ? file.remoteContent : file.localContent,
    }));
    const allResolutions = [...resolvedConflicts, ...remainingResolutions];

    // Atualiza o estado da UI antes de retomar o sync para esconder de imediato
    // os conflitos que já foram resolvidos em bloco.
    setFiles([]);
    setResolvedConflicts(allResolutions);
    onResolveAllConflicts(allResolutions);
  };

  const onConflictResolved = (fileIndex: number, content: string) => {
    // Remove the file from the conflicts to resolve
    const remainingFiles = files.filter((_, index) => index !== fileIndex);
    setFiles(remainingFiles);
    // Keep track of the resolved conflicts
    const newResolvedConflicts = [
      ...resolvedConflicts,
      {
        filePath: files[fileIndex].filePath,
        content,
      },
    ];
    setResolvedConflicts(newResolvedConflicts);
    if (remainingFiles.length === 0) {
      // We solved all conflicts, we can resume syncing
      onResolveAllConflicts(newResolvedConflicts);
    }
  };

  const renderConflict = (file: ConflictFile, index: number) => {
    return (
      <div
        key={file.filePath}
        style={{
          width: "100%",
          paddingTop: "var(--size-4-4)",
          paddingBottom: "var(--size-4-4)",
          borderBottom: "1px solid var(--background-modifier-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="inline-title"
          style={{
            width: "100%",
            paddingLeft: "var(--size-4-8)",
            paddingRight: "var(--size-4-8)",
          }}
        >
          {file.filePath}
        </div>
        <DiffView
          initialRemoteText={file.remoteContent || ""}
          initialLocalText={file.localContent || ""}
          onConflictResolved={(content: string) => {
            onConflictResolved(index, content);
          }}
        />
      </div>
    );
  };

  return (
    <React.StrictMode>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              position: "relative",
              textAlign: "center",
              alignSelf: "center",
            }}
          >
            <div
              style={{
                margin: "20px 0",
                fontWeight: "var(--h2-weight)",
                fontSize: "var(--h2-size)",
                lineHeight: "var(--line-height-tight)",
              }}
            >
              No conflicts to resolve
            </div>
            <div
              style={{
                margin: "20px 0",
                fontSize: "var(--font-text-size)",
                color: "var(--text-muted)",
                lineHeight: "var(--line-height-tight)",
              }}
            >
              That's good, keep going
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--size-4-2)",
                padding: "var(--size-4-2) var(--size-4-4)",
                borderBottom: "1px solid var(--background-modifier-border)",
                backgroundColor: "var(--background-primary)",
              }}
            >
              <button onClick={() => resolveAllWithSource("remote")}>
                Keep remote
              </button>
              <button onClick={() => resolveAllWithSource("local")}>
                Keep local
              </button>
            </div>
            {files.map(renderConflict)}
          </>
        )}
      </div>
    </React.StrictMode>
  );
};

export default UnifiedView;
