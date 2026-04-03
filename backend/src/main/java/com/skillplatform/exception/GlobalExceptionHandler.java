package com.skillplatform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 资源不存在 */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /** 请求体解析失败（缺少字段、格式错误等） */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "请求格式错误：" + ex.getMessage());
    }

    /** 路径参数类型不匹配 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return error(HttpStatus.BAD_REQUEST, "参数类型错误：" + ex.getName());
    }

    /** 业务异常（如 OAuth 失败、ZIP 打包失败等），统一 500 */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String msg = ex.getMessage();
        // 若消息含"not found"则返回 404，其余一律 500
        if (msg != null && msg.toLowerCase().contains("not found")) {
            return error(HttpStatus.NOT_FOUND, msg);
        }
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "服务器内部错误");
    }

    /** 兜底 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "服务器内部错误");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "error", message,
                "status", status.value(),
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
