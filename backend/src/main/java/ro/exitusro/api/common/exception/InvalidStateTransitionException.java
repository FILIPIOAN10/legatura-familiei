package ro.exitusro.api.common.exception;

import ro.exitusro.api.common.enums.CaseStatus;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(CaseStatus from, CaseStatus to) {
        super("Invalid case status transition: " + from + " -> " + to);
    }
}
