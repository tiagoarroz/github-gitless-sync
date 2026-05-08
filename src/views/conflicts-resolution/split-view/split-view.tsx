import * as React from "react";
import { ConflictFile, ConflictResolution } from "src/sync-manager";
import DiffView from "./diff-view";
import FilesTabBar from "./files-tab-bar";

const SplitView = ({
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
  const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
  const currentFile = files.at(currentFileIndex);

  const resolveAllWithSource = (source: "remote" | "local") => {
    // Mantém as resoluções já feitas manualmente e resolve os conflitos restantes
    // com a fonte selecionada no topo da janela.
    const remainingResolutions = files.map((file) => ({
      filePath: file.filePath,
      content: source === "remote" ? file.remoteContent : file.localContent,
    }));
    onResolveAllConflicts([...resolvedConflicts, ...remainingResolutions]);
  };

  const onConflictResolved = () => {
    // Remove the file from the conflicts to resolve
    const remainingFiles = files.filter(
      (_, index) => index !== currentFileIndex,
    );
    setFiles(remainingFiles);
    // Keep track of the resolved conflicts
    const newResolvedConflicts = [
      ...resolvedConflicts,
      {
        filePath: currentFile!.filePath,
        content: currentFile!.localContent,
      },
    ];
    setResolvedConflicts(newResolvedConflicts);
    // Select the previous file only if we're not already at the start
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
    if (remainingFiles.length === 0) {
      // We solved all conflicts, we can resume syncing
      onResolveAllConflicts(newResolvedConflicts);
    }
  };

  return (
    <React.StrictMode>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
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
            <FilesTabBar
              files={files.map((f) => f.filePath)}
              currentFile={currentFile?.filePath || ""}
              setCurrentFileIndex={setCurrentFileIndex}
            />
            <div
              style={{
                overflow: "auto",
                flex: 1,
              }}
            >
              <DiffView
                remoteText={currentFile?.remoteContent || ""}
                localText={currentFile?.localContent || ""}
                onRemoteTextChange={(content: string) => {
                  const tempFiles = [...files];
                  tempFiles[currentFileIndex].remoteContent = content;
                  setFiles(tempFiles);
                }}
                onLocalTextChange={(content: string) => {
                  const tempFiles = [...files];
                  tempFiles[currentFileIndex].localContent = content;
                  setFiles(tempFiles);
                }}
                onConflictResolved={onConflictResolved}
              />
            </div>
          </>
        )}
      </div>
    </React.StrictMode>
  );
};

export default SplitView;
