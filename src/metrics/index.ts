import { Request, Response, NextFunction } from "express";
import { httpRequestDurationMicroseconds } from "./requestTime";
import { activeRequestsGauge } from "./activeRequests";
import { requestCounter } from "./requestCount";


export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  const path = req.route ? req.route.path : req.path;
  

  path !== "/metrics" &&
    activeRequestsGauge.inc({
      method: req.method,
      route: path,
    });


  res.on("finish", function () {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Increment request counter
    path !== "/metrics" &&
      requestCounter.inc({
        method: req.method,
        route: path,
        status_code: res.statusCode,
      });

    // Calculate request time
    path !== "/metrics" &&
      httpRequestDurationMicroseconds.observe(
        {
          method: req.method,
          route: path,
          code: res.statusCode,
        },
        duration
      );

    // Calculate active requests
    path !== "/metrics" &&
      setTimeout(() => {
        activeRequestsGauge.dec({
          method: req.method,
          route: path,
        });
      }, 10000);
  });
  
  next();
};


// export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   const startTime = Date.now();
//   activeRequestsGauge.inc();

//   res.on('finish', function() {
//       const endTime = Date.now();
//       const duration = endTime - startTime;

//       // Increment request counter
//       requestCounter.inc({
//           method: req.method,
//           route: req.route ? req.route.path : req.path,
//           status_code: res.statusCode
//       });

//       httpRequestDurationMicroseconds.observe({
//           method: req.method,
//           route: req.route ? req.route.path : req.path,
//           code: res.statusCode
//       }, duration);

//       activeRequestsGauge.dec();
//   });
//   next();
// }