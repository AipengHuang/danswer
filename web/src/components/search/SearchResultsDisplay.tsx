"use client";

import {
  DocumentRelevance,
  SearchDanswerDocument,
  SearchDefaultOverrides,
  SearchResponse,
} from "@/lib/search/interfaces";
import { usePopup } from "../admin/connectors/Popup";
import { AlertIcon, BroomIcon, MagnifyingIcon, UndoIcon } from "../icons/icons";
import { AgenticDocumentDisplay, DocumentDisplay } from "./DocumentDisplay";
import { searchState } from "./SearchSection";
import { useContext, useEffect, useState } from "react";
import { Tooltip } from "../tooltip/Tooltip";
import KeyboardSymbol from "@/lib/browserUtilities";
import { SettingsContext } from "../settings/SettingsProvider";
import { DISABLE_LLM_DOC_RELEVANCE } from "@/lib/constants";

const getSelectedDocumentIds = (
  documents: SearchDanswerDocument[],
  selectedIndices: number[]
) => {
  const selectedDocumentIds = new Set<string>();
  selectedIndices.forEach((ind) => {
    selectedDocumentIds.add(documents[ind].document_id);
  });
  return selectedDocumentIds;
};

export const SearchResultsDisplay = ({
  agenticResults,
  searchResponse,
  contentEnriched,
  disabledAgentic,
  isFetching,
  defaultOverrides,
  performSweep,
  searchState,
  sweep,
}: {
  searchState: searchState;
  disabledAgentic?: boolean;
  contentEnriched?: boolean;
  agenticResults?: boolean | null;
  performSweep: () => void;
  sweep?: boolean;
  searchResponse: SearchResponse | null;
  isFetching: boolean;
  defaultOverrides: SearchDefaultOverrides;
  comments: any;
}) => {
  const commandSymbol = KeyboardSymbol();
  const { popup, setPopup } = usePopup();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case "o":
            event.preventDefault();

            performSweep();
            if (agenticResults) {
              setShowAll((showAll) => !showAll);
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [performSweep, agenticResults]);

  if (!searchResponse) {
    return null;
  }

  const { answer, quotes, documents, error, messageId } = searchResponse;

  if (isFetching && disabledAgentic) {
    return (
      <div className="mt-4">
        <div className="flex justify-between pb-1 mb-3 text-lg font-bold border-b text-emphasis border-border">
          <p>Results</p>
        </div>
      </div>
    );
  }

  if (isFetching && !answer && !documents) {
    return null;
  }
  if (documents != null && documents.length == 0 && searchState == "input") {
    return (
      <div className="text-base gap-x-1.5 flex flex-col">
        <div className="flex items-center font-semibold gap-x-2">
          <AlertIcon size={16} />
          No documents were found!
        </div>
        <p>
          Have you set up a connector? Your data may not have loaded properly.
        </p>
      </div>
    );
  }

  if (
    answer === null &&
    (documents === null || documents.length === 0) &&
    !isFetching
  ) {
    return (
      <div className="mt-4">
        {error && (
          <div className="text-sm text-error">
            <div className="flex">
              <AlertIcon size={16} className="my-auto mr-1 text-error" />
              <p className="italic">{error || "No documents were found!"}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedDocumentIds = getSelectedDocumentIds(
    documents || [],
    searchResponse.selectedDocIndices || []
  );
  const relevantDocs = documents
    ? documents.filter((doc) => {
      return (
        showAll ||
        (searchResponse &&
          searchResponse.additional_relevance &&
          searchResponse.additional_relevance[doc.document_id] &&
          searchResponse.additional_relevance[doc.document_id].relevant) ||
        doc.is_relevant
      );
    })
    : [];

  const getUniqueDocuments = (
    documents: SearchDanswerDocument[]
  ): SearchDanswerDocument[] => {
    const seenIds = new Set<string>();
    return documents.filter((doc) => {
      if (!seenIds.has(doc.document_id)) {
        seenIds.add(doc.document_id);
        return true;
      }
      return false;
    });
  };

  const uniqueDocuments = getUniqueDocuments(documents || []);

  return (
    <>
      {popup}

      {documents && documents.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between pb-1 mb-3 text-lg font-bold border-b text-emphasis border-border">
            <p>Results</p>
            {!DISABLE_LLM_DOC_RELEVANCE &&
              (contentEnriched || searchResponse.additional_relevance) && (
                <Tooltip
                  delayDuration={1000}
                  content={<div className="flex">{commandSymbol}O</div>}
                >
                  <button
                    onClick={() => {
                      performSweep();
                      if (agenticResults) {
                        setShowAll((showAll) => !showAll);
                      }
                    }}
                    className={`flex items-center justify-center animate-fade-in-up rounded-lg p-1 text-xs transition-all duration-300 w-20 h-8 ${!sweep
                      ? "bg-background-agentic-toggled text-text-agentic-toggled"
                      : "bg-background-agentic-untoggled text-text-agentic-untoggled"
                      }`}
                    style={{
                      transform: sweep ? "rotateZ(180deg)" : "rotateZ(0deg)",
                    }}
                  >
                    <div
                      className={`flex items-center ${sweep ? "rotate-180" : ""}`}
                    >
                      <span></span>
                      {!sweep
                        ? agenticResults
                          ? "Show All"
                          : "Focus"
                        : agenticResults
                          ? "Focus"
                          : "Show All"}

                      <span className="ml-1">
                        {!sweep ? (
                          <MagnifyingIcon className="w-4 h-4" />
                        ) : (
                          <UndoIcon className="w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </button>
                </Tooltip>
              )}
          </div>

          {agenticResults &&
            relevantDocs &&
            contentEnriched &&
            relevantDocs.length == 0 &&
            !showAll && (
              <p className="flex text-lg font-bold">
                No high quality results found by agentic search.
              </p>
            )}

          {uniqueDocuments.map((document, ind) => {
            const relevance: DocumentRelevance | null =
              searchResponse.additional_relevance
                ? searchResponse.additional_relevance[document.document_id]
                : null;

            return agenticResults ? (
              <AgenticDocumentDisplay
                additional_relevance={relevance}
                contentEnriched={contentEnriched}
                index={ind}
                hide={showAll || relevance?.relevant || document.is_relevant}
                key={`${document.document_id}-${ind}`}
                document={document}
                documentRank={ind + 1}
                messageId={messageId}
                isSelected={selectedDocumentIds.has(document.document_id)}
                setPopup={setPopup}
              />
            ) : (
              <DocumentDisplay
                additional_relevance={relevance}
                contentEnriched={contentEnriched}
                index={ind}
                hide={sweep && !document.is_relevant && !relevance?.relevant}
                key={`${document.document_id}-${ind}`}
                document={document}
                documentRank={ind + 1}
                messageId={messageId}
                isSelected={selectedDocumentIds.has(document.document_id)}
                setPopup={setPopup}
              />
            );
          })}
        </div>
      )}

      <div className="h-[100px]" />
    </>
  );
};

export function AgenticDisclaimer({
  forceNonAgentic,
}: {
  forceNonAgentic: () => void;
}) {
  return (
    <div className="flex flex-col mx-12 ml-auto transition-all duration-300 animate-fade-in gap-y-2">
      <p className="text-sm">
        Please note that agentic quries can take substantially longer than
        non-agentic queries. You can click <i>non-agentic</i> to re-submit your
        query without agentic capabilities.
      </p>
      <button
        onClick={forceNonAgentic}
        className="p-2 my-auto mr-auto text-xs rounded-lg bg-background-900 text-text-200"
      >
        Non-agentic
      </button>
    </div>
  );
}
