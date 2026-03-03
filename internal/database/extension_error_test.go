package database

import (
	"errors"
	"strings"
	"testing"
)

func TestWrapExtensionError_Nil(t *testing.T) {
	if WrapExtensionError(nil) != nil {
		t.Error("expected nil for nil input")
	}
}

func TestWrapExtensionError_NeuronDBFunction(t *testing.T) {
	err := errors.New("ERROR: function neurondb_get_model_config(text) does not exist")
	wrapped := WrapExtensionError(err)
	if wrapped == err {
		t.Error("expected wrapped error")
	}
	if !strings.Contains(wrapped.Error(), "NeuronDB extension is not installed") {
		t.Errorf("expected clear message, got: %s", wrapped.Error())
	}
}

func TestWrapExtensionError_VectorType(t *testing.T) {
	err := errors.New("ERROR: type \"vector\" does not exist")
	wrapped := WrapExtensionError(err)
	if wrapped == err {
		t.Error("expected wrapped error")
	}
	if !strings.Contains(wrapped.Error(), "vector type not found") && !strings.Contains(wrapped.Error(), "CREATE EXTENSION vector") {
		t.Errorf("expected vector message, got: %s", wrapped.Error())
	}
}

func TestWrapExtensionError_OtherError(t *testing.T) {
	err := errors.New("syntax error at end of input")
	wrapped := WrapExtensionError(err)
	if wrapped != err {
		t.Error("expected same error for non-extension errors")
	}
}
