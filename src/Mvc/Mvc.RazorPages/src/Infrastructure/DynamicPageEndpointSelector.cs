// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;

namespace Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure
{
    internal class DynamicPageEndpointSelector : IDisposable
    {
        private readonly ActionSelector _actionSelector;
        private readonly PageActionEndpointDataSource _dataSource;
        private readonly DataSourceDependentCache<ActionSelectionTable<RouteEndpoint>> _cache;

        public DynamicPageEndpointSelector(PageActionEndpointDataSource dataSource, ActionSelector actionSelector)
        {
            if (dataSource == null)
            {
                throw new ArgumentNullException(nameof(dataSource));
            }

            if (actionSelector == null)
            {
                throw new ArgumentNullException(nameof(actionSelector));
            }

            _dataSource = dataSource;
            _actionSelector = actionSelector;
            _cache = new DataSourceDependentCache<ActionSelectionTable<RouteEndpoint>>(dataSource, Initialize);
        }

        private ActionSelectionTable<RouteEndpoint> Table => _cache.EnsureInitialized();

        public IReadOnlyList<RouteEndpoint> SelectEndpoints(RouteValueDictionary values)
        {
            if (values == null)
            {
                throw new ArgumentNullException(nameof(values));
            }

            var table = Table;
            var matches = table.Select(values);
            return matches;
        }

        public Endpoint SelectBestEndpoint(HttpContext httpContext, RouteValueDictionary values, IReadOnlyList<RouteEndpoint> endpoints)
        {
            if (endpoints == null)
            {
                throw new ArgumentNullException(nameof(endpoints));
            }

            var context = new RouteContext(httpContext);
            context.RouteData = new RouteData(values);

            var actions = new ActionDescriptor[endpoints.Count];
            for (var i = 0; i < endpoints.Count; i++)
            {
                actions[i] = endpoints[i].Metadata.GetMetadata<ActionDescriptor>();
            }

            // SelectBestCandidate throws for ambiguities so we don't have to handle that here.
            var action = _actionSelector.SelectBestCandidate(context, actions);
            if (action == null)
            {
                return null;
            }

            for (var i = 0; i < actions.Length; i++)
            {
                if (object.ReferenceEquals(action, actions[i]))
                {
                    return endpoints[i];
                }
            }

            // This should never happen. We need to do *something* here for the code to compile, so throwing.
            throw new InvalidOperationException("ActionSelector returned an action that was not a candidate.");
        }


        private static ActionSelectionTable<RouteEndpoint> Initialize(IReadOnlyList<Endpoint> endpoints)
        {
            return ActionSelectionTable<RouteEndpoint>.Create(endpoints);
        }

        public void Dispose()
        {
            _cache.Dispose();
        }
    }
}
