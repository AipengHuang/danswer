import { DanswerDocument } from "@/lib/search/interfaces";
import { Divider, Text } from "@tremor/react";
import { ChatDocumentDisplay } from "./ChatDocumentDisplay";
import { usePopup } from "@/components/admin/connectors/Popup";
import { removeDuplicateDocs } from "@/lib/documentUtils";
import { Message } from "../interfaces";
import { ForwardedRef, forwardRef } from "react";
import { X } from "lucide-react";

interface CustomComponentProps {
  closeSidebar: () => void;
  selectedMessage: Message | null;
  selectedDocuments: DanswerDocument[] | null;
  toggleDocumentSelection: (document: DanswerDocument) => void;
  clearSelectedDocuments: () => void;
  selectedDocumentTokens: number;
  maxTokens: number;
  isLoading: boolean;
  initialWidth: number;
}

export const CustomComponent = forwardRef<HTMLDivElement, CustomComponentProps>(
  (
    {
      closeSidebar,
      selectedMessage,
      selectedDocuments,
      toggleDocumentSelection,
      clearSelectedDocuments,
      selectedDocumentTokens,
      maxTokens,
      isLoading,
      initialWidth,

    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { popup, setPopup } = usePopup();

    const selectedDocumentIds =
      selectedDocuments?.map((document) => document.document_id) || [];

    const currentDocuments = selectedMessage?.documents || null;
    const dedupedDocuments = removeDuplicateDocs(currentDocuments || []);

    // 检查令牌限制
    const tokenLimitReached = selectedDocumentTokens > maxTokens - 75;

    return (
      <div
        id="custom-component"
        className="flex justify-center w-full pt-40 pb-40 mx-auto "
        ref={ref}
        style={{
          width: initialWidth,
        }}

      >

        <div className="relative flex flex-col w-full h-full pb-6 overflow-y-hidden rounded-lg bg-text-100">
          <X className="absolute text-2xl cursor-pointer top-2 right-2" onClick={closeSidebar} />

          {popup}
          <div className="flex flex-col pl-3 pr-1 mt-3 text-2xl font-semibold text-text-800">
            {dedupedDocuments.length} 文档
            <p className="flex flex-wrap mt-1 text-sm font-semibold gap-x-3 text-text-600">
              选择以添加到连续上下文
              <a
                href="https://docs.danswer.dev/introduction"
                className="underline cursor-pointer hover:text-strong"
              >
                了解更多
              </a>
            </p>
          </div>

          <Divider className="pb-2 mt-4 mb-0" />

          {currentDocuments ? (
            <div className="relative flex flex-col flex-grow overflow-y-auto dark-scrollbar">

              {dedupedDocuments.length > 0 ? (
                dedupedDocuments.map((document, ind) => (
                  <div
                    key={document.document_id}
                    className={`${ind === dedupedDocuments.length - 1
                      ? ""
                      : "border-b border-border-light"
                      }`}
                  >
                    <ChatDocumentDisplay
                      document={document}
                      setPopup={setPopup}
                      queryEventId={null}
                      isAIPick={false}
                      isSelected={selectedDocumentIds.includes(
                        document.document_id
                      )}
                      handleSelect={(documentId) => {
                        toggleDocumentSelection(
                          dedupedDocuments.find(
                            (doc) => doc.document_id === documentId
                          )!
                        );
                      }}
                      tokenLimitReached={tokenLimitReached}
                    />
                  </div>
                ))
              ) : (
                <div className="mx-3">
                  <Text>未找到相关文档。</Text>
                </div>
              )}
            </div>
          ) : (
            !isLoading && (
              <div className="ml-4 mr-3">
                <Text>当你提问后，检索到的文档将显示在这里！</Text>
              </div>
            )
          )}

          <div className="flex justify-center w-full mt-4 gap-x-4">
            <button
              className="bg-[#84e49e] text-xs p-2 rounded text-text-800"
              onClick={() => {
                // 处理保存更改的逻辑
              }}
            >
              保存更改
            </button>

            <button
              className="p-2 text-xs rounded bg-error text-text-200"
              onClick={() => {
                clearSelectedDocuments();
                // 处理删除上下文的逻辑
              }}
            >
              删除上下文
            </button>
          </div>
        </div>
      </div>
    );
  }
);

CustomComponent.displayName = "CustomComponent";
